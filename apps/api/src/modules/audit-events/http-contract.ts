import { schemaIds } from "../../http-schemas.js";

export const ingestEventRouteSchema = {
  tags: ["events"],
  summary: "Ingests an audit event",
  security: [{ bearerAuth: [] }],
  body: {
    $ref: `${schemaIds.ingestEventBody}#`
  },
  response: {
    202: {
      $ref: `${schemaIds.eventAcceptedResponse}#`
    },
    400: {
      $ref: `${schemaIds.validationErrorResponse}#`
    },
    401: {
      $ref: `${schemaIds.simpleErrorResponse}#`
    },
    402: {
      $ref: `${schemaIds.eventQuotaExceededResponse}#`
    },
    429: {
      $ref: `${schemaIds.rateLimitErrorResponse}#`
    }
  }
};

export const listEventsRouteSchema = {
  tags: ["events"],
  summary: "Lists audit events for the authenticated project",
  security: [{ bearerAuth: [] }],
  querystring: {
    $ref: `${schemaIds.listEventsQuery}#`
  },
  response: {
    200: {
      $ref: `${schemaIds.eventListResponse}#`
    },
    400: {
      $ref: `${schemaIds.validationErrorResponse}#`
    },
    401: {
      $ref: `${schemaIds.simpleErrorResponse}#`
    },
    429: {
      $ref: `${schemaIds.rateLimitErrorResponse}#`
    }
  }
};

export const summarizeEventsRouteSchema = {
  tags: ["events"],
  summary: "Returns event summary statistics for the authenticated project",
  security: [{ bearerAuth: [] }],
  querystring: {
    $ref: `${schemaIds.summarizeEventsQuery}#`
  },
  response: {
    200: {
      $ref: `${schemaIds.eventStatsResponse}#`
    },
    400: {
      $ref: `${schemaIds.validationErrorResponse}#`
    },
    401: {
      $ref: `${schemaIds.simpleErrorResponse}#`
    },
    429: {
      $ref: `${schemaIds.rateLimitErrorResponse}#`
    }
  }
};

export const timeseriesEventsRouteSchema = {
  tags: ["events"],
  summary: "Returns time-bucketed event counts for the authenticated project",
  security: [{ bearerAuth: [] }],
  querystring: {
    $ref: `${schemaIds.timeseriesEventsQuery}#`
  },
  response: {
    200: {
      $ref: `${schemaIds.eventTimeseriesResponse}#`
    },
    400: {
      $ref: `${schemaIds.validationErrorResponse}#`
    },
    401: {
      $ref: `${schemaIds.simpleErrorResponse}#`
    },
    429: {
      $ref: `${schemaIds.rateLimitErrorResponse}#`
    }
  }
};
