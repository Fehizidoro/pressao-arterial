import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Activity, BarChart3, Heart, Shield, Users, FileText, ChevronRight, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  if (!loading && isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif font-semibold text-lg text-foreground">CardioTrack</span>
          </div>
          <a href={getLoginUrl()}>
            <Button variant="default" size="sm" className="gap-1.5">
              Entrar
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Heart className="w-3.5 h-3.5" />
            Monitoramento inteligente de pressão arterial
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-semibold text-foreground leading-tight mb-6">
            Cuide da sua{" "}
            <span className="text-primary">saúde</span>{" "}
            com precisão
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Registre, monitore e analise suas medições de pressão arterial com classificação automática
            baseada nas diretrizes médicas mais recentes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={getLoginUrl()}>
              <Button size="lg" className="gap-2 px-8 text-base">
                Começar gratuitamente
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-12 border-y border-border bg-card">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "6", label: "Classificações clínicas" },
              { value: "∞", label: "Perfis de pacientes" },
              { value: "PDF", label: "Exportação de relatórios" },
              { value: "100%", label: "Gratuito e seguro" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-serif font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Uma plataforma completa para monitorar a saúde cardiovascular com elegância e precisão.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Activity,
                title: "Registro de Medições",
                desc: "Registre sistólica, diastólica e frequência cardíaca com data e hora precisas.",
              },
              {
                icon: Shield,
                title: "Classificação Automática",
                desc: "Classificação instantânea conforme diretrizes da AHA e Sociedade Brasileira de Cardiologia.",
              },
              {
                icon: BarChart3,
                title: "Gráficos de Evolução",
                desc: "Visualize tendências ao longo do tempo com gráficos interativos e intuitivos.",
              },
              {
                icon: Users,
                title: "Múltiplos Perfis",
                desc: "Gerencie a saúde de toda a família com perfis individuais por paciente.",
              },
              {
                icon: FileText,
                title: "Relatórios em PDF",
                desc: "Exporte relatórios completos para compartilhar com seu médico.",
              },
              {
                icon: Heart,
                title: "Dashboard Inteligente",
                desc: "Estatísticas e tendências apresentadas de forma clara e elegante.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 bp-card-shadow hover:bp-card-shadow-hover"
              >
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-serif font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Classification Reference */}
      <section className="py-16 px-4 bg-card border-y border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-3">
              Tabela de Classificação
            </h2>
            <p className="text-muted-foreground">Baseada nas diretrizes da AHA 2017 e SBC 2020</p>
          </div>
          <div className="rounded-2xl border border-border overflow-hidden bp-card-shadow">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Classificação</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Sistólica</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Diastólica</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Hipotensão", sys: "< 90", dia: "< 60", color: "text-blue-700", dot: "bg-blue-500" },
                  { label: "Normal", sys: "< 130", dia: "< 80", color: "text-emerald-700", dot: "bg-emerald-500" },
                  { label: "Elevada", sys: "130–139", dia: "80–89", color: "text-amber-700", dot: "bg-amber-500" },
                  { label: "Hipertensão Grau 1", sys: "140–159", dia: "90–99", color: "text-orange-700", dot: "bg-orange-500" },
                  { label: "Hipertensão Grau 2", sys: "160–179", dia: "100–109", color: "text-red-700", dot: "bg-red-500" },
                  { label: "Hipertensão Grau 3", sys: "≥ 180", dia: "≥ 110", color: "text-rose-800", dot: "bg-rose-600" },
                ].map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-2 font-medium ${row.color}`}>
                        <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                        {row.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-center font-mono ${row.color}`}>{row.sys}</td>
                    <td className={`px-4 py-3 text-center font-mono ${row.color}`}>{row.dia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-foreground mb-4">
            Comece a monitorar hoje
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Acesso gratuito, seguro e disponível em qualquer dispositivo.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="gap-2 px-10 text-base">
              Criar conta gratuita
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" />
            </div>
            <span className="font-serif font-semibold text-foreground">CardioTrack</span>
          </div>
          <p className="text-sm text-muted-foreground">
            As informações não substituem consulta médica profissional.
          </p>
        </div>
      </footer>
    </div>
  );
}
