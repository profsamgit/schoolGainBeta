'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  ra: z.string().min(1, 'O RA é obrigatório.'),
  turma: z.string().min(1, 'A turma é obrigatória.'),
});

export default function RegisterStudentPage() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      ra: '',
      turma: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Here you would typically send the data to your backend/database
    console.log(values);
    toast({
      title: 'Aluno Cadastrado!',
      description: `${values.name} (RA: ${values.ra}) foi adicionado com sucesso.`,
    });
    form.reset();
  }

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            Cadastrar Novo Aluno
          </CardTitle>
          <CardDescription>
            Preencha as informações para registrar um novo aluno no sistema.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: João da Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RA (Registro Acadêmico)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="turma"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turma</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 8º B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Cadastrar Aluno
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
