/**
 * Generated from apps/api /api/v1/openapi.json.
 *
 * Refresh with:
 * pnpm --filter web api:types
 */
export interface paths {
  "/api/v1/auth/magic-links": {
    post: {
      requestBody: {
        content: {
          "application/json": {
            email: string;
          };
        };
      };
      responses: {
        202: {
          content: {
            "application/json": {
              accepted: boolean;
            };
          };
        };
      };
    };
  };
  "/api/v1/auth/sessions": {
    post: {
      requestBody: {
        content: {
          "application/json": {
            email: string;
            token: string;
          };
        };
      };
      responses: {
        201: {
          content: {
            "application/json": {
              user: components["schemas"]["AuthUser"];
            };
          };
        };
      };
    };
  };
  "/api/v1/auth/sessions/current": {
    delete: {
      responses: {
        204: never;
      };
    };
  };
  "/api/v1/me": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["CurrentUserResponse"];
          };
        };
      };
    };
  };
  "/api/v1/events": {
    get: {
      parameters: {
        query?: {
          actor?: string;
          cursor?: string;
          event?: string;
          from?: string;
          limit?: number;
          target?: string;
          to?: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["EventListResponse"];
          };
        };
      };
    };
  };
  "/api/v1/events/stats": {
    get: {
      parameters: {
        query?: {
          from?: string;
          to?: string;
          top?: number;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["EventStatsResponse"];
          };
        };
      };
    };
  };
  "/api/v1/events/timeseries": {
    get: {
      parameters: {
        query?: {
          bucket?: "hour" | "day";
          from: string;
          to: string;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": components["schemas"]["EventTimeseriesResponse"];
          };
        };
      };
    };
  };
}

export interface components {
  schemas: {
    AuthUser: {
      email: string;
      id: string;
      name?: string;
    };
    CurrentUserResponse: {
      memberships: Array<{
        organizationId: string;
        projectIds: string[];
        role: "owner" | "admin" | "member" | "viewer";
      }>;
      user: components["schemas"]["AuthUser"];
    };
    EventListResponse: {
      events: Array<{
        actor?: string;
        createdAt: string;
        event: string;
        id: string;
        metadata: Record<string, unknown>;
        target?: string;
      }>;
      pageInfo: {
        hasMore: boolean;
        nextCursor: string | null;
      };
    };
    EventStatsResponse: {
      topEventTypes: Array<{
        count: number;
        event: string;
      }>;
      totalEvents: number;
    };
    EventTimeseriesResponse: {
      points: Array<{
        bucketStart: string;
        count: number;
      }>;
    };
  };
}
