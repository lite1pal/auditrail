#!/usr/bin/env bash

set -euo pipefail

TASKS_DIR="${TASKS_DIR:-tasks}"

usage() {
  cat <<'EOF'
Usage:
  scripts/task-sync.sh validate
  scripts/task-sync.sh help

Notes:
  - tasks/*.txt are the only task tracker.
  - The agent should edit the category task files directly.
  - This script validates the local task file shape across the tasks directory.
EOF
}

fail() {
  echo "Error: $*" >&2
  exit 1
}

require_tasks_dir() {
  [[ -d "$TASKS_DIR" ]] || fail "Missing $TASKS_DIR"
}

collect_task_files() {
  local files=("$TASKS_DIR"/*.txt)
  [[ -e "${files[0]}" ]] || fail "No task files found in $TASKS_DIR"
  printf '%s\n' "${files[@]}"
}

validate() {
  local task_files=()
  while IFS= read -r file; do
    task_files+=("$file")
  done < <(collect_task_files)
  python3 - "${task_files[@]}" <<'PY'
from pathlib import Path
import re
import sys

task_header = re.compile(r"^- \[[ x~]\] (T-\d{3}) .+$")
field_line = re.compile(r"^  ([a-z_]+):(.*)$")
list_item = re.compile(r"^    - .+$")
allowed_status = {"todo", "ready", "in_progress", "blocked", "review", "done"}

required_fields = {
    "status",
    "priority",
    "owner",
    "branch",
    "pr",
    "last_updated",
    "blocked_reason",
    "files",
    "acceptance",
}

seen = set()
errors = []

for raw_path in sys.argv[1:]:
    path = Path(raw_path)
    lines = path.read_text().splitlines()

    current = None
    current_fields = set()
    in_list = None

    for index, line in enumerate(lines, start=1):
        header = task_header.match(line)
        if header:
            task_id = header.group(1)
            if task_id in seen:
                errors.append(f"{path}:{index}: duplicate task id {task_id}")
            seen.add(task_id)
            current = task_id
            current_fields = set()
            in_list = None
            continue

        if current is None:
            continue

        if line.startswith("## "):
            missing = required_fields - current_fields
            if missing:
                errors.append(
                    f"{path}: task {current}: missing fields {', '.join(sorted(missing))}"
                )
            current = None
            current_fields = set()
            in_list = None
            continue

        field = field_line.match(line)
        if field:
            name = field.group(1)
            current_fields.add(name)
            in_list = name if name in {"files", "acceptance"} else None
            if name == "status":
                status = field.group(2).strip()
                if status not in allowed_status:
                    errors.append(f"{path}: task {current}: invalid status `{status}`")
            continue

        if in_list and line.strip():
            if not list_item.match(line):
                errors.append(
                    f"{path}:{index}: invalid list item format under {in_list}"
                )
            continue

        if line.strip():
            errors.append(f"{path}:{index}: unexpected content inside task block")

    if current is not None:
        missing = required_fields - current_fields
        if missing:
            errors.append(
                f"{path}: task {current}: missing fields {', '.join(sorted(missing))}"
            )

if errors:
    for error in errors:
        print(error)
    raise SystemExit(1)

print(f"Validated {len(seen)} tasks across {len(sys.argv) - 1} files")
PY
}

main() {
  local command="${1:-help}"
  require_tasks_dir

  case "$command" in
    help|-h|--help)
      usage
      ;;
    validate)
      validate
      ;;
    *)
      fail "Unknown command: $command"
      ;;
  esac
}

main "$@"
