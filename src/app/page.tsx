import { Card, CardTitle, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowRight, Laptop, Shield, User } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary">Bem-vindo ao SchoolGain</h1>
        <p className="text-lg text-muted-foreground mt-2">Selecione seu perfil de acesso para continuar.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        <Link href="/login/student" className="block h-full">
          <Card className="hover:border-primary hover:shadow-lg transition-all h-full flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
              <User className="w-10 h-10 text-primary" />
              <div>
                <CardTitle>Área do Aluno</CardTitle>
                <CardDescription>Faça login com seu RA para acessar seu painel.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-end justify-end text-sm font-medium text-primary">
                Acessar <ArrowRight className="w-4 h-4 ml-2" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/login/admin" className="block h-full">
          <Card className="hover:border-primary hover:shadow-lg transition-all h-full flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
              <Shield className="w-10 h-10 text-primary" />
              <div>
                <CardTitle>Área do Gestor</CardTitle>
                <CardDescription>Acesse o painel de gerenciamento do sistema.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-end justify-end text-sm font-medium text-primary">
                Acessar <ArrowRight className="w-4 h-4 ml-2" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/kiosk" className="block h-full">
          <Card className="hover:border-primary hover:shadow-lg transition-all h-full flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
              <Laptop className="w-10 h-10 text-primary" />
              <div>
                <CardTitle>Terminal Kiosk</CardTitle>
                <CardDescription>Ponto de coleta para registro rápido de resíduos por RA.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-end justify-end text-sm font-medium text-primary">
                Utilizar <ArrowRight className="w-4 h-4 ml-2" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
