/** OpenAPI 3.0 specification for SwapSpot REST APIs. */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SwapSpot API",
    description:
      "Skill-swap platform REST API. Protected routes accept `Authorization: Bearer <token>` or the httpOnly `swapspot_token` cookie.",
    version: "0.1.0",
  },
  servers: [
    {
      url: "/",
      description: "Current host",
    },
  ],
  tags: [
    { name: "Health", description: "Service health" },
    { name: "Auth", description: "Registration, login, OTP, logout" },
    { name: "Users", description: "Current user, dashboard, matches, profiles" },
    { name: "Swaps", description: "Proposals and swap lifecycle" },
    { name: "Conversations", description: "Inbox and messages" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT from login or OTP verification",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "swapspot_token",
        description: "HttpOnly session cookie set on login / OTP verify",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          reason: { type: "string" },
        },
        required: ["error"],
      },
      SessionUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          fullName: { type: "string" },
          firstName: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          location: { type: "string" },
          bio: { type: "string" },
          avatar: { type: "string" },
          skillsOffer: { type: "array", items: { type: "string" } },
          skillsWant: { type: "array", items: { type: "string" } },
          balance: { type: "integer" },
          onboardingComplete: { type: "boolean" },
        },
      },
      MatchProfile: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          location: { type: "string" },
          rating: { type: "string" },
          avatar: { type: "string" },
          available: { type: "boolean" },
          offer: { type: "string" },
          want: { type: "string" },
          bio: { type: "string" },
          memberSince: { type: "string" },
          completedSwaps: { type: "integer" },
          skills: { type: "array", items: { type: "string" } },
        },
      },
      Swap: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: ["ongoing", "proposal", "completed"],
          },
          exchange: { type: "string", nullable: true },
          partnerId: { type: "string", nullable: true },
          partnerName: { type: "string", nullable: true },
          statusLabel: { type: "string", nullable: true },
          description: { type: "string", nullable: true },
          deposit: { type: "number", example: 50 },
          swapping: { type: "string", nullable: true },
          partner: { type: "string", nullable: true },
          timer: { type: "string", nullable: true },
          action: { type: "string", nullable: true },
          status: { type: "string", nullable: true },
          startedAt: { type: "string", nullable: true },
          deadline: { type: "string", nullable: true },
          name: { type: "string", nullable: true },
          offering: { type: "string", nullable: true },
          receivedAt: { type: "string", nullable: true },
          swapped: { type: "string", nullable: true },
          rating: { type: "string", nullable: true },
          completedAt: { type: "string", nullable: true },
          profile: {
            oneOf: [{ $ref: "#/components/schemas/MatchProfile" }, { type: "null" }],
          },
        },
      },
      SwapsPayload: {
        type: "object",
        properties: {
          ongoingSwaps: {
            type: "array",
            items: { $ref: "#/components/schemas/Swap" },
          },
          pendingProposals: {
            type: "array",
            items: { $ref: "#/components/schemas/Swap" },
          },
          completedSwaps: {
            type: "array",
            items: { $ref: "#/components/schemas/Swap" },
          },
        },
      },
      Conversation: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          avatar: { type: "string" },
          initials: { type: "string" },
          preview: { type: "string" },
          time: { type: "string" },
          unread: { type: "integer" },
          online: { type: "boolean" },
          active: { type: "boolean" },
        },
      },
      ChatMessage: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["incoming", "outgoing"] },
          text: { type: "string" },
          time_label: { type: "string", nullable: true },
          quote: { type: "string", nullable: true },
          message_type: { type: "string" },
        },
      },
      Activity: {
        type: "object",
        properties: {
          text: { type: "string" },
          time: { type: "string", nullable: true },
          order: { type: "integer" },
        },
      },
      AuthTokenResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: { $ref: "#/components/schemas/SessionUser" },
        },
        required: ["token", "user"],
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        description: "Returns OK status and total user count from SQLite.",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    users: { type: "integer", example: 6 },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: {
                    type: "string",
                    minLength: 8,
                    example: "password123",
                  },
                  username: { type: "string", description: "Optional display name" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created; verify with OTP",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    email: { type: "string" },
                    demoOtp: { type: "string", example: "123456" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "409": {
            description: "Email already registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify email OTP",
        description: "Demo OTP is always `123456`. Sets auth cookie and returns JWT.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code"],
                properties: {
                  email: { type: "string", format: "email" },
                  code: { type: "string", example: "123456" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Verified; session started",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthTokenResponse" },
              },
            },
          },
          "400": {
            description: "Invalid or expired OTP",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Account not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Sign in",
        description:
          "Accepts email or username (`full_name`). Demo: `demo@swapspot.test` / `password123`.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: {
                  email: {
                    type: "string",
                    description: "Email or username",
                    example: "demo@swapspot.test",
                  },
                  username: {
                    type: "string",
                    description: "Alias for email/username field",
                  },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Signed in",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthTokenResponse" },
              },
            },
          },
          "400": {
            description: "Missing credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "403": {
            description: "Browse-only seed profile cannot sign in",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Sign out",
        description: "Clears the `swapspot_token` cookie.",
        responses: {
          "200": {
            description: "Logged out",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean", example: true } },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/me": {
      get: {
        tags: ["Users"],
        summary: "Current user",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Session user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/SessionUser" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update current user / onboarding",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fullName: { type: "string" },
                  phone: { type: "string" },
                  location: { type: "string" },
                  bio: { type: "string" },
                  avatar: { type: "string" },
                  skillsOffer: { type: "array", items: { type: "string" } },
                  skillsWant: { type: "array", items: { type: "string" } },
                  onboardingComplete: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/SessionUser" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/users/dashboard": {
      get: {
        tags: ["Users"],
        summary: "Dashboard payload",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Dashboard data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: {
                      oneOf: [
                        { $ref: "#/components/schemas/SessionUser" },
                        { type: "null" },
                      ],
                    },
                    stats: {
                      type: "object",
                      properties: {
                        activeSwaps: { type: "integer" },
                        proposals: { type: "integer" },
                        newMessages: { type: "integer" },
                        balance: { type: "integer" },
                      },
                    },
                    activities: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Activity" },
                    },
                    matches: {
                      type: "array",
                      items: { $ref: "#/components/schemas/MatchProfile" },
                    },
                    allMatches: {
                      type: "array",
                      items: { $ref: "#/components/schemas/MatchProfile" },
                    },
                    searchPlaceholder: { type: "string" },
                    unreadCount: { type: "integer" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/users/matches": {
      get: {
        tags: ["Users"],
        summary: "Ranked skill matches",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Match list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    matches: {
                      type: "array",
                      items: { $ref: "#/components/schemas/MatchProfile" },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/users/profiles/{id}": {
      get: {
        tags: ["Users"],
        summary: "Public browseable profile",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "eric" },
          },
        ],
        responses: {
          "200": {
            description: "Profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    profile: { $ref: "#/components/schemas/MatchProfile" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Profile not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/swaps": {
      get: {
        tags: ["Swaps"],
        summary: "List current user swaps",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Grouped swaps",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SwapsPayload" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/swaps/propose": {
      post: {
        tags: ["Swaps"],
        summary: "Propose a swap",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["partnerId", "offering", "exchange"],
                properties: {
                  partnerId: { type: "string", example: "eric" },
                  partnerName: { type: "string", example: "Eric Yates" },
                  offering: {
                    type: "string",
                    example: "Photography",
                    description: "Skill you want from the partner",
                  },
                  exchange: {
                    type: "string",
                    example: "UI Design",
                    description: "Skill you offer",
                  },
                  description: { type: "string" },
                  deadline: {
                    type: "string",
                    format: "date",
                    example: "2026-06-23",
                    description: "Proposed swap end date",
                  },
                  deposit: {
                    type: "number",
                    example: 50,
                    description:
                      "Escrow deposit amount; cannot exceed the user's available balance",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Proposal created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    proposal: { $ref: "#/components/schemas/Swap" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Partner not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "409": {
            description: "Duplicate proposal",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/swaps/{id}": {
      get: {
        tags: ["Swaps"],
        summary: "Get swap by id",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", example: "ongoing-eric" },
          },
        ],
        responses: {
          "200": {
            description: "Swap detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    swap: { $ref: "#/components/schemas/Swap" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Swap not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/swaps/{id}/accept": {
      post: {
        tags: ["Swaps"],
        summary: "Accept proposal",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Accepted swap",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    swap: { $ref: "#/components/schemas/Swap" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Proposal not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/swaps/{id}/decline": {
      post: {
        tags: ["Swaps"],
        summary: "Decline proposal",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Declined",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean", example: true } },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Proposal not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/swaps/{id}/complete": {
      post: {
        tags: ["Swaps"],
        summary: "Mark swap complete",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Updated swaps payload",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SwapsPayload" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Swap not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/swaps/{id}/file-dispute": {
      post: {
        tags: ["Swaps"],
        summary: "File a dispute on an active swap",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: {
                  reason: {
                    type: "string",
                    description: "Why you are filing the dispute",
                  },
                  response: {
                    type: "string",
                    description: "Alias for reason",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Dispute filed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    swap: { $ref: "#/components/schemas/Swap" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing reason",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Active swap not found or already in dispute",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/swaps/{id}/dispute": {
      post: {
        tags: ["Swaps"],
        summary: "Respond to dispute",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["response"],
                properties: {
                  response: {
                    type: "string",
                    description: "Dispute reply text",
                  },
                  responseText: {
                    type: "string",
                    description: "Alias for response",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated swap",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    swap: { $ref: "#/components/schemas/Swap" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Dispute swap not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/swaps/{id}/review": {
      post: {
        tags: ["Swaps"],
        summary: "Submit swap rating",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating"],
                properties: {
                  rating: {
                    oneOf: [
                      { type: "number", example: 5 },
                      { type: "string", example: "5" },
                    ],
                    description: "Star rating value",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated swap",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    swap: { $ref: "#/components/schemas/Swap" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing rating",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Completed swap not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/conversations": {
      get: {
        tags: ["Conversations"],
        summary: "List inbox conversations",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "Conversations",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    conversations: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Conversation" },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/conversations/{id}/messages": {
      get: {
        tags: ["Conversations"],
        summary: "Conversation messages",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Thread",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    conversation: { $ref: "#/components/schemas/Conversation" },
                    messages: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ChatMessage" },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "404": {
            description: "Conversation not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
  },
} as const;
