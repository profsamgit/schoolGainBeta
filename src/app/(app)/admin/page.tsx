'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { WasteChart } from '@/components/waste-chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { leaderboardData } from '@/lib/data';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

const studentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  ra: z.string().min(1, 'O RA é obrigatório.'),
  turma: z.string().min(1, 'A turma é obrigatória.'),
  // Omit points and level from validation, they are not directly editable here
});

type StudentFormValues = z.infer<typeof studentSchema>;
type Student = Omit<User, 'email' | 'avatar' | 'role'>;

export default function AdminPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>(leaderboardData);
  const [isEditStudentDialogOpen, setIsEditStudentDialogOpen] = useState(false);
  const [isNewStudentDialogOpen, setIsNewStudentDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const totalWaste = 5880;
  const topStudent = students[0];

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      id: '',
      name: '',
      ra: '',
      turma: '',
    },
  });

  const handleNewStudent = () => {
    form.reset();
    setSelectedStudent(null);
    setIsNewStudentDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    form.reset({
      id: student.id,
      name: student.name,
      ra: student.ra,
      turma: student.turma,
    });
    setIsEditStudentDialogOpen(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const onConfirmDelete = () => {
    if (!selectedStudent) return;
    setStudents(students.filter((s) => s.id !== selectedStudent.id));
    toast({
      title: 'Aluno Removido!',
      description: `${selectedStudent.name} foi removido do sistema.`,
    });
    setIsDeleteDialogOpen(false);
    setSelectedStudent(null);
  };

  function onSubmit(values: StudentFormValues) {
    // If it's an edit
    if (selectedStudent && values.id) {
      setStudents(
        students.map((s) =>
          s.id === values.id ? { ...s, name: values.name, ra: values.ra!, turma: values.turma! } : s
        )
      );
      toast({
        title: 'Aluno Atualizado!',
        description: `Os dados de ${values.name} foram atualizados.`,
      });
      setIsEditStudentDialogOpen(false);
    } else {
      // If it's a new student
      const newStudent: Student = {
        id: `user-${Date.now()}`,
        name: values.name,
        ra: values.ra!,
        turma: values.turma!,
        points: 0,
        level: 'Bronze',
      };
      setStudents([newStudent, ...students]);
      toast({
        title: 'Aluno Cadastrado!',
        description: `${newStudent.name} foi adicionado com sucesso.`,
      });
      setIsNewStudentDialogOpen(false);
    }
    form.reset();
    setSelectedStudent(null);
  }

  const StudentForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        <DialogFooter>
          <Button type="submit">Salvar</Button>
        </DialogFooter>
      </form>
    </Form>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Painel do Gestor
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso e o impacto do projeto SchoolGain.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Resíduos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWaste} kg</div>
              <p className="text-xs text-muted-foreground">+5% vs. mês passado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">+10 desde a última semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Principal Contribuidor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topStudent?.name}</div>
              <p className="text-xs text-muted-foreground">{topStudent?.points} pontos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciamento de Alunos</CardTitle>
                <CardDescription>
                  Adicione, edite ou remova alunos do sistema.
                </CardDescription>
              </div>
              <Button onClick={handleNewStudent}>
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar Aluno
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>RA</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.ra}</TableCell>
                      <TableCell>{student.turma}</TableCell>
                      <TableCell className="text-right">{student.points}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteStudent(student)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <WasteChart />
      </div>

      {/* New Student Dialog */}
      <Dialog open={isNewStudentDialogOpen} onOpenChange={setIsNewStudentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
            <DialogDescription>
              Preencha os dados para adicionar um novo aluno ao sistema.
            </DialogDescription>
          </DialogHeader>
          {StudentForm}
        </DialogContent>
      </Dialog>
      
      {/* Edit Student Dialog */}
      <Dialog open={isEditStudentDialogOpen} onOpenChange={setIsEditStudentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
            <DialogDescription>
              Atualize os dados do aluno selecionado.
            </DialogDescription>
          </DialogHeader>
          {StudentForm}
        </DialogContent>
      </Dialog>

      {/* Delete Student Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá remover permanentemente o aluno
              <span className="font-bold"> {selectedStudent?.name} </span>
              do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
