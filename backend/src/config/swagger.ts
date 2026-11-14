import { ENV } from "./env";

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "NextShopID REST API Documentation",
    version: "1.0.0",
    description:
      "Dokumentasi resmi RESTful API untuk platform e-commerce NextShopID. Digunakan oleh developer frontend (Web & Mobile) untuk integrasi autentikasi, otorisasi, dan fitur-fitur transaksi.",
    contact: {
      name: "Tim Developer NextShopID",
      url: "https://github.com/NewX-Team/NextShopID",
    },
  },
  servers: [
    {
      url: `http://localhost:${ENV.PORT}`,
      description: "Development Server Lokal",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Masukkan JWT token yang diperoleh saat login (format: Bearer <token>).",
      },
    },
    schemas: {
      StandardResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operasi berhasil dieksekusi." },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Pesan deskripsi kesalahan." },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Pembeli Contoh" },
          username: { type: "string", example: "pembeli" },
          email: { type: "string", example: "pembeli@gmail.com" },
          role: { type: "string", enum: ["admin", "penjual", "user"], example: "user" },
          created_at: { type: "string", example: "2026-11-09T08:00:00.000Z" },
          updated_at: { type: "string", example: "2026-11-09T08:00:00.000Z" },
        },
      },
      RegisterPayload: {
        type: "object",
        required: ["name", "username", "email", "password"],
        properties: {
          name: { type: "string", example: "John Doe" },
          username: { type: "string", example: "johndoe" },
          email: { type: "string", format: "email", example: "johndoe@example.com" },
          password: { type: "string", format: "password", minLength: 6, example: "password123" },
        },
      },
      LoginPayload: {
        type: "object",
        required: ["identifier", "password"],
        properties: {
          identifier: {
            type: "string",
            description: "Bisa menggunakan username atau alamat email terdaftar",
            example: "pembeli@gmail.com",
          },
          password: { type: "string", format: "password", example: "pembeli12345" },
        },
      },
      ForgotPasswordPayload: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "pembeli@gmail.com" },
        },
      },
      ResetPasswordPayload: {
        type: "object",
        required: ["token", "password"],
        properties: {
          token: {
            type: "string",
            description: "Token acak 64-karakter hex yang diterima via email",
            example: "b29849e9331474cee33aa91769c93ac6bff21864899d3707a1cbe5b902bca271",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 6,
            example: "newpassword123",
          },
          confirmPassword: {
            type: "string",
            format: "password",
            minLength: 6,
            example: "newpassword123",
          },
        },
      },
      ChangePasswordPayload: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: {
            type: "string",
            format: "password",
            example: "pembeli12345",
          },
          newPassword: {
            type: "string",
            format: "password",
            minLength: 6,
            example: "pembelibaru123",
          },
          confirmPassword: {
            type: "string",
            format: "password",
            minLength: 6,
            example: "pembelibaru123",
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Pemeriksaan Kesehatan Server (Health Check)",
        responses: {
          200: {
            description: "Server beroperasi normal.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", example: "2026-11-09T08:00:00.000Z" },
                    environment: { type: "string", example: "development" },
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
        tags: ["Authentication"],
        summary: "Pendaftaran Pengguna Baru (Role: user)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterPayload" },
            },
          },
        },
        responses: {
          201: {
            description: "Registrasi akun berhasil.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Pendaftaran akun berhasil." },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validasi gagal (field kosong, email/username duplikat, dsb).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login Akun (Mendapatkan Bearer JWT Token)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginPayload" },
            },
          },
        },
        responses: {
          200: {
            description: "Autentikasi berhasil.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login berhasil." },
                    token: {
                      type: "string",
                      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: {
            description: "Kredensial tidak valid (username/email atau password salah).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Mendapatkan Profil Akun Pengguna Aktif",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Profil berhasil diambil.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: {
            description: "Token tidak disertakan atau sudah kedaluwarsa.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Password Recovery"],
        summary: "Permintaan Pemulihan Kata Sandi via Email",
        description:
          "Mengirimkan instruksi pemulihan kata sandi ke email terdaftar. Pada lingkungan dev dengan MAIL_MAILER=log, isi email dan link reset dicatat ke file logs/mail.log dan terminal backend.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordPayload" },
            },
          },
        },
        responses: {
          200: {
            description: "Permintaan berhasil diproses (pesan sukses generik anti-enumeration).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardResponse" },
              },
            },
          },
          400: {
            description: "Format email tidak valid atau field kosong.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Password Recovery"],
        summary: "Menetapkan Kata Sandi Baru Menggunakan Token Reset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordPayload" },
            },
          },
        },
        responses: {
          200: {
            description: "Kata sandi berhasil diperbarui. Pengguna dapat login kembali.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardResponse" },
              },
            },
          },
          400: {
            description: "Token tidak valid, kedaluwarsa, atau konfirmasi kata sandi tidak cocok.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/change-password": {
      post: {
        tags: ["Authentication"],
        summary: "Mengubah Kata Sandi untuk Pengguna yang Sedang Login",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePasswordPayload" },
            },
          },
        },
        responses: {
          200: {
            description: "Kata sandi berhasil diperbarui.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardResponse" },
              },
            },
          },
          400: {
            description: "Kata sandi saat ini salah atau konfirmasi baru tidak cocok.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Autentikasi diperlukan (Bearer token tidak valid).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/auth/admin-only": {
      get: {
        tags: ["Role-Based Access Control"],
        summary: "Endpoint Khusus Administrator (Role: admin)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Akses diizinkan.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardResponse" },
              },
            },
          },
          401: { description: "Unauthenticated (tidak menyertakan token)." },
          403: { description: "Forbidden (bukan role admin)." },
        },
      },
    },
    "/api/auth/penjual-only": {
      get: {
        tags: ["Role-Based Access Control"],
        summary: "Endpoint Khusus Merchant/Penjual (Role: penjual)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Akses diizinkan.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardResponse" },
              },
            },
          },
          401: { description: "Unauthenticated (tidak menyertakan token)." },
          403: { description: "Forbidden (bukan role penjual)." },
        },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin - Manajemen Pengguna"],
        summary: "Mengambil daftar seluruh pengguna dengan filter pencarian dan role",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "search", in: "query", schema: { type: "string" }, description: "Pencarian nama, username, atau email" },
          { name: "role", in: "query", schema: { type: "string", enum: ["all", "admin", "penjual", "user"] }, description: "Filter berdasarkan role" },
          { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "oldest", "name_asc", "name_desc"] }, description: "Pengurutan data" },
        ],
        responses: {
          200: { description: "Daftar pengguna dan agregasi statistik berhasil diambil." },
          401: { description: "Unauthenticated (tidak menyertakan token)." },
          403: { description: "Forbidden (bukan role admin)." },
        },
      },
    },
    "/api/admin/users/{id}/role": {
      patch: {
        tags: ["Admin - Manajemen Pengguna"],
        summary: "Mengubah role akun pengguna",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" }, description: "ID akun pengguna" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["role"],
                properties: {
                  role: { type: "string", enum: ["admin", "penjual", "user"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Role berhasil diperbarui." },
          400: { description: "Data tidak valid." },
          403: { description: "Forbidden (tidak dapat mengubah superadmin utama)." },
        },
      },
    },
  },
};
