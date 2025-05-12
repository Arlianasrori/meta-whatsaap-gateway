import { z } from 'zod';

/**
 * DTO untuk validasi request register
 */
export const registerSchema = z.object({
  name: z.string({required_error : "Name is required",message : "name should be a string"}).min(3, { message: 'Nama minimal 3 karakter' })
    .min(3, { message: 'Nama minimal 3 karakter' })
    .max(100, { message: 'Nama maksimal 100 karakter' }),
  
  phoneNumber: z.string({ message : "phoneNumber should be a string",required_error : "phoneNumber is required"}),
  
  password: z.string({required_error : "Password is required",message : "password should be a string"})
    .min(6, { message: 'Password minimal 6 karakter' })
    .max(100, { message: 'Password maksimal 100 karakter' }),
  
  address: z.string({required_error : "Address is required",message : "address should be a string"})
    .max(255, { message: 'Alamat maksimal 255 karakter' })
    .nullable()
    .optional(),
  
  businessName: z.string({required_error : "Business Name is required",message : "businessName should be a string"})
    .max(100, { message: 'Nama bisnis maksimal 100 karakter' })
    .nullable()
    .optional()
});

/**
 * DTO untuk validasi request login
 */
export const loginSchema = z.object({
  phoneNumber: z.string({required_error : "Phone Number is required",message : "phoneNumber should be a string"}),
  
  password: z.string({required_error : "Password is required",message : "password should be a string"})
});

/**
 * DTO untuk validasi request update profile
 */
export const updateProfileSchema = z.object({
  name: z.string({required_error : "Name is required",message : "name should be a string"})
    .min(3, { message: 'Nama minimal 3 karakter' })
    .max(100, { message: 'Nama maksimal 100 karakter' })
    .optional(),
  
  address: z.string({required_error : "Address is required",message : "address should be a string"})
    .max(255, { message: 'Alamat maksimal 255 karakter' })
    .nullable()
    .optional(),
  
  businessName: z.string({required_error : "Business Name is required",message : "businessName should be a string"})
    .max(100, { message: 'Nama bisnis maksimal 100 karakter' })
    .nullable()
    .optional()
})
.refine(
  (data) => Object.keys(data).length > 0, 
  { message: 'Minimal satu field harus diupdate' }
); 