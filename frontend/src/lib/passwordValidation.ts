// Keep these checks aligned with the strong password rule in backend/src/modules/auth/auth.validator.ts.
export function getPasswordValidationError(password: string, isAr: boolean): string | null {
  if (password.length < 8) {
    return isAr ? 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل' : 'Password must be at least 8 characters long'
  }
  if (!/[A-Z]/.test(password)) {
    return isAr ? 'يجب أن تحتوي كلمة المرور على حرف إنجليزي كبير واحد على الأقل' : 'Password must contain at least one uppercase letter'
  }
  if (!/[a-z]/.test(password)) {
    return isAr ? 'يجب أن تحتوي كلمة المرور على حرف إنجليزي صغير واحد على الأقل' : 'Password must contain at least one lowercase letter'
  }
  if (!/\d/.test(password)) {
    return isAr ? 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل' : 'Password must contain at least one number'
  }
  if (!/[@$!%*?&]/.test(password)) {
    return isAr ? 'يجب أن تحتوي كلمة المرور على رمز واحد على الأقل من @$!%*?&' : 'Password must contain at least one special character from @$!%*?&'
  }
  if (/[^A-Za-z\d@$!%*?&]/.test(password)) {
    return isAr ? 'يمكن أن تحتوي كلمة المرور على أحرف إنجليزية وأرقام والرموز @$!%*?& فقط' : 'Password can contain only English letters, numbers, and @$!%*?&'
  }
  return null
}
