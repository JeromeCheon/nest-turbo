'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { loginSchema, type LoginInput } from '@/lib/auth-schemas';
import {
  DUMMY_NETWORK_ERROR_EMAIL,
  DUMMY_WRONG_PASSWORD,
  setDummySessionCookie,
} from '@/lib/dummy-auth';

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginInput) {
    if (values.email === DUMMY_NETWORK_ERROR_EMAIL) {
      form.setError('root', {
        message: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      });
      return;
    }

    if (values.password === DUMMY_WRONG_PASSWORD) {
      form.setError('root', {
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
      return;
    }

    setDummySessionCookie();
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold">로그인</h1>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {form.formState.errors.root ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              로그인
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
