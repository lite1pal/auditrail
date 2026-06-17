"use client";

import { Button } from "../src/components/ui/button";

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="page-shell">
      <section className="table-state" role="alert">
        <h1>Unable to load AuditTrail</h1>
        <p>{error.message}</p>
        <Button onClick={reset}>Retry</Button>
      </section>
    </main>
  );
}
