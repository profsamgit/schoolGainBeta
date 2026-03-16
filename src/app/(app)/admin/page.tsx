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
  DialogFooter,
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
import { leaderboardData, mockAdmin } from '@/lib/data';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserPlus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const userSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  ra: z.string().min(1, 'O RA é obrigatório.'),
  turma: z.string().min(1, 'A turma é obrigatória.'),
  role: z.enum(['student', 'admin'], { required_error: 'O cargo é obrigatório.'}),
});

type UserFormValues = z.infer<typeof userSchema>;
type EditableUser = Omit<User, 'email' | 'avatar'>;

export default function AdminPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<EditableUser[]>([
    ...leaderboardData,
    { id: mockAdmin.id, name: mockAdmin.name, points: mockAdmin.points, level: mockAdmin.level, ra: mockAdmin.ra, turma: mockAdmin.turma, role: mockAdmin.role },
  ].sort((a,b) => a.name.localeCompare(b.name)));
  
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EditableUser | null>(null);

  const totalWaste = 5880;
  const studentUsers = users.filter((u) => u.role === 'student');
  const topStudent = studentUsers.length > 0 ? studentUsers.sort((a, b) => b.points - a.points)[0] : null;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: '',
      name: '',
      ra: '',
      turma: '',
      role: 'student',
    },
  });

  const handleNewUser = () => {
    form.reset();
    setSelectedUser(null);
    setIsNewUserDialogOpen(true);
  };

  const handleEditUser = (user: EditableUser) => {
    setSelectedUser(user);
    form.reset({
      id: user.id,
      name: user.name,
      ra: user.ra,
      turma: user.turma,
      role: user.role,
    });
    setIsEditUserDialogOpen(true);
  };

  const handleDeleteUser = (user: EditableUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const onConfirmDelete = () => {
    if (!selectedUser) return;
    setUsers(users.filter((s) => s.id !== selectedUser.id));
    toast({
      title: 'Usuário Removido!',
      description: `${selectedUser.name} foi removido do sistema.`,
    });
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  function onSubmit(values: UserFormValues) {
    if (selectedUser && values.id) {
      setUsers(
        users.map((s) =>
          s.id === values.id ? { ...s, name: values.name, ra: values.ra!, turma: values.turma!, role: values.role } : s
        )
      );
      toast({
        title: 'Usuário Atualizado!',
        description: `Os dados de ${values.name} foram atualizados.`,
      });
      setIsEditUserDialogOpen(false);
    } else {
      const newUser: EditableUser = {
        id: `${values.role}-${Date.now()}`,
        name: values.name,
        ra: values.ra!,
        turma: values.turma!,
        role: values.role,
        points: 0,
        level: 'Bronze',
      };
      setUsers([...users, newUser].sort((a,b) => a.name.localeCompare(b.name)));
      toast({
        title: 'Usuário Cadastrado!',
        description: `${newUser.name} foi adicionado com sucesso.`,
      });
      setIsNewUserDialogOpen(false);
    }
    form.reset();
    setSelectedUser(null);
  }

  const UserForm = (
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
         <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo do usuário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="student">Aluno</SelectItem>
                    <SelectItem value="admin">Gestor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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
              <div className="text-2xl font-bold">{studentUsers.length}</div>
              <p className="text-xs text-muted-foreground">+10 desde a última semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Principal Contribuidor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{topStudent?.name ?? 'N/A'}</div>
              <p className="text-xs text-muted-foreground">{topStudent?.points ?? 0} pontos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  Adicione, edite ou remova usuários do sistema.
                </CardDescription>
              </div>
              <Button onClick={handleNewUser}>
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar Usuário
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>RA</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.ra}</TableCell>
                      <TableCell>{user.turma}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Gestor' : 'Aluno'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{user.points}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteUser(user)} className="text-red-600">
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

      {/* New User Dialog */}
      <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para adicionar um novo usuário ao sistema.
            </DialogDescription>
          </DialogHeader>
          {UserForm}
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize os dados do usuário selecionado.
            </DialogDescription>
          </DialogHeader>
          {UserForm}
        </DialogContent>
      </Dialog>

      {/* Delete User Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá remover permanentemente o usuário
              <span className="font-bold"> {selectedUser?.name} </span>
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
