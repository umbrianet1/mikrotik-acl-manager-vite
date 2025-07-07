import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RouterConnection } from '@/components/RouterConnection';
import { ConfigurationView } from '@/components/ConfigurationView';
import { RouterData } from '@/types/mikrotik';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  
  const [router1, setRouter1] = useState<RouterData>({
    credentials: {
      id: '1',
      name: 'Router Principale',
      host: '',
      username: '',
      password: ''
    },
    addressLists: [],
    firewallRules: [],
    isConnected: false,
    loading: false
  });

  const [router2, setRouter2] = useState<RouterData>({
    credentials: {
      id: '2',
      name: 'Router Secondario',
      host: '',
      username: '',
      password: ''
    },
    addressLists: [],
    firewallRules: [],
    isConnected: false,
    loading: false
  });

  const handleRouterConnect = (routerNumber: 1 | 2, data: RouterData) => {
    if (routerNumber === 1) {
      setRouter1(data);
      if (data.isConnected && !data.error) {
        toast({
          title: "Router 1 Connesso",
          description: `Trovate ${data.addressLists.length} address list e ${data.firewallRules.length} regole firewall`,
        });
      }
    } else {
      setRouter2(data);
      if (data.isConnected && !data.error) {
        toast({
          title: "Router 2 Connesso", 
          description: `Trovate ${data.addressLists.length} address list e ${data.firewallRules.length} regole firewall`,
        });
      }
    }
  };

  const exportConfiguration = (routerData: RouterData) => {
    if (!routerData.isConnected) return;
    
    const config = {
      router: routerData.credentials,
      timestamp: new Date().toISOString(),
      addressLists: routerData.addressLists,
      firewallRules: routerData.firewallRules
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mikrotik-config-${routerData.credentials.name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Configurazione esportata",
      description: `File scaricato per ${routerData.credentials.name}`,
    });
  };

  const compareRouters = () => {
    if (!router1.isConnected || !router2.isConnected) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Entrambi i router devono essere connessi per il confronto",
      });
      return;
    }

    // Analisi semplice delle differenze
    const router1Lists = new Set(router1.addressLists.map(item => `${item.list}:${item.address}`));
    const router2Lists = new Set(router2.addressLists.map(item => `${item.list}:${item.address}`));
    
    const uniqueToRouter1 = [...router1Lists].filter(x => !router2Lists.has(x));
    const uniqueToRouter2 = [...router2Lists].filter(x => !router1Lists.has(x));
    
    let message = 'Confronto completato:\n';
    message += `• ${router1.credentials.name}: ${router1.addressLists.length} address list, ${router1.firewallRules.length} regole\n`;
    message += `• ${router2.credentials.name}: ${router2.addressLists.length} address list, ${router2.firewallRules.length} regole\n`;
    
    if (uniqueToRouter1.length > 0 || uniqueToRouter2.length > 0) {
      message += `• Differenze: ${uniqueToRouter1.length + uniqueToRouter2.length} elementi unici`;
    } else {
      message += '• Le address list sono identiche';
    }
    
    toast({
      title: "Confronto Router",
      description: message,
    });
  };

  const getConnectedCount = () => {
    return [router1, router2].filter(r => r.isConnected).length;
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="bg-gradient-hero p-8 rounded-xl shadow-glow text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            MikroTik Configuration Manager
          </h1>
          <p className="text-white/90 text-lg">
            Gestisci e confronta le configurazioni dei tuoi router MikroTik
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Router connessi: {getConnectedCount()}/2
            </Badge>
          </div>
        </div>

        {/* Connection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RouterConnection
            routerData={router1}
            onConnect={(data) => handleRouterConnect(1, data)}
            routerNumber={1}
          />
          <RouterConnection
            routerData={router2}
            onConnect={(data) => handleRouterConnect(2, data)}
            routerNumber={2}
          />
        </div>

        {/* Control Panel */}
        {getConnectedCount() > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Operazioni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => exportConfiguration(router1)}
                  disabled={!router1.isConnected}
                  variant="outline"
                >
                  Esporta Router 1
                </Button>
                <Button
                  onClick={() => exportConfiguration(router2)}
                  disabled={!router2.isConnected}
                  variant="outline"
                >
                  Esporta Router 2
                </Button>
                <Button
                  onClick={compareRouters}
                  disabled={!router1.isConnected || !router2.isConnected}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Confronta Router
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Views */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ConfigurationView routerData={router1} routerNumber={1} />
          <ConfigurationView routerData={router2} routerNumber={2} />
        </div>

        {/* Info Card */}
        <Card className="shadow-card bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Informazioni di Utilizzo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Requisiti MikroTik:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• API REST abilitata (porta 80/443)</li>
                  <li>• CORS configurato (se necessario)</li>
                  <li>• Utente con privilegi di lettura</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Funzionalità:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Visualizzazione address list</li>
                  <li>• Visualizzazione regole firewall</li>
                  <li>• Esportazione configurazioni</li>
                  <li>• Confronto tra router</li>
                </ul>
              </div>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Nota:</strong> Se i router non sono raggiungibili, l'app mostrerà dati demo per testare l'interfaccia.
                In produzione, configurare HTTPS e un backend sicuro per gestire le credenziali.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;