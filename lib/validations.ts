import { z } from "zod";

const noSQLInjection = (val: string) =>
  !/(--|;|\/\*|\*\/|xp_|exec|select|insert|update|delete|drop|union|char\(|nchar\()/i.test(val);

const noXSS = (val: string) =>
  !/<script|javascript:|on\w+\s*=|<iframe|<object|<embed/i.test(val);

const safeString = (label: string, min = 2, max = 100) =>
  z
    .string()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`)
    .refine(noSQLInjection, { message: `${label} contains invalid characters` })
    .refine(noXSS, { message: `${label} contains invalid content` });

export const signUpSchema = z
  .object({
    name: safeString("Full name"),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number")
      .optional()
      .or(z.literal("")),
    state: z.string().min(1, "Please select your state"),
    lga: safeString("LGA"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v, "You must accept the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  name: safeString("Full name"),
  phone: z
    .string()
    .regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number")
    .optional()
    .or(z.literal("")),
  state: z.string().optional(),
  lga: safeString("LGA").optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const lgaSignUpSchema = z
  .object({
    lgaName: safeString("LGA name"),
    state: z.string().min(1, "Please select a state"),
    chairmanName: safeString("Chairman's name"),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number"),
    officeAddress: safeString("Office address", 5, 255),
    population: z.string().optional(),
    description: z
      .string()
      .max(1000, "Description must be at most 1000 characters")
      .optional(),
    sectors: z.array(z.string()).min(1, "Select at least one sector"),
    tenureStartDate: z.string().optional(),
    tenureEndDate: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v, "You must accept the terms and conditions"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const lgaLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type LGASignUpInput = z.infer<typeof lgaSignUpSchema>;
export type LGALoginInput = z.infer<typeof lgaLoginSchema>;

// OTP schemas
export const otpSendSchema = z.object({
  identifier: z.string().email("Invalid email address"),
  purpose: z.enum(["CITIZEN_LOGIN", "LGA_LOGIN", "REGISTER", "SENSITIVE"]),
});

export const otpVerifySchema = z.object({
  identifier: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must be numeric"),
  purpose: z.enum(["CITIZEN_LOGIN", "LGA_LOGIN", "REGISTER", "SENSITIVE"]),
});

export type OTPSendInput = z.infer<typeof otpSendSchema>;
export type OTPVerifyInput = z.infer<typeof otpVerifySchema>;
