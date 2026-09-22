'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  registerRobotSchema,
  type RegisterRobotInput,
} from '@/lib/robot-schemas';
import { useRobotStore } from '@/lib/robot-store';

export function RobotRegisterDialog() {
  const [open, setOpen] = React.useState(false);
  const addRobot = useRobotStore((s) => s.addRobot);
  const form = useForm<RegisterRobotInput>({
    resolver: zodResolver(registerRobotSchema),
    defaultValues: { name: '', model: '' },
  });

  async function onSubmit(values: RegisterRobotInput) {
    // ponytail: 실제 POST /robots 없이 클라이언트 상태에 즉시 추가하는 더미 흐름.
    // 실연동 Task에서 실제 fetch 호출로 교체된다.
    await new Promise((resolve) => setTimeout(resolve, 300));

    addRobot({
      id: crypto.randomUUID(),
      name: values.name,
      model: values.model,
      status: 'idle',
      createdAt: new Date().toISOString(),
    });

    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: 'default' })}>
        로봇 등록
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>로봇 등록</DialogTitle>
          <DialogDescription>
            새 로봇의 이름과 모델명을 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>모델명</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose className={buttonVariants({ variant: 'outline' })}>
                취소
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                등록
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
