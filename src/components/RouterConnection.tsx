import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RouterCredentials, RouterData } from '@/types/mikrotik';
import { createMikroTikApi, createMockData } from '@/services/mikrotikApi';

interface RouterConnectionProps {
  routerData: RouterData;
  onConnect: (data: RouterData) => void;
  routerNumber: number;
}

export function RouterConnection({ routerData, onConnect, routerNumber }: RouterConnectionProps) {
  const [credentials, setCredentials] = useState<RouterCredentials>(routerData.credentials);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleInputChange = (field: keyof RouterCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Aggiorna i dati del router con stato di caricamento
      onConnect({
        ...routerData,
        credentials,
        loading: true,
        error: undefined
      });

      const api = createMikroTikApi(credentials);
      const result = await api.connect();

      if (result.success && result.data) {
        onConnect({
          credentials,
          addressLists: result.data.addressLists,
          firewallRules: result.data.firewallRules,
          isConnected: true,
          loading: false,
          error: undefined
        });
      } else {
        onConnect({
          ...routerData,
          credentials,
          isConnected: false,
          loading: false,
          error: result.error || 'Errore di connessione'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      onConnect({
        ...routerData,
        credentials,
        isConnected: false,
        loading: false,
        error: `Errore di connessione: ${errorMessage}`
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const getStatusBadge = () => {
    if (routerData.loading || isConnecting) {
      return <Badge variant="secondary">Connessione...</Badge>;
    }
    if (routerData.isConnected) {
      return <Badge variant="default" className="bg-success text-success-foreground">Connesso</Badge>;
    }
    if (routerData.error) {
      return <Badge variant="destructive">Errore</Badge>;
    }
    return <Badge variant="outline">Non connesso</Badge>;
  };

  return (
    <Card className="shadow-card bg-gradient-card transition-smooth">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Router {routerNumber}
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label htmlFor={`name-${routerNumber}`} className="text-sm font-medium">
              Nome Router
            </Label>
            <Input
              id={`name-${routerNumber}`}
              placeholder="Es: Router Principale"
              value={credentials.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor={`host-${routerNumber}`} className="text-sm font-medium">
              Indirizzo IP
            </Label>
            <Input
              id={`host-${routerNumber}`}
              placeholder="192.168.1.1"
              value={credentials.host}
              onChange={(e) => handleInputChange('host', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor={`username-${routerNumber}`} className="text-sm font-medium">
              Username
            </Label>
            <Input
              id={`username-${routerNumber}`}
              placeholder="admin"
              value={credentials.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor={`password-${routerNumber}`} className="text-sm font-medium">
              Password
            </Label>
            <Input
              id={`password-${routerNumber}`}
              type="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {routerData.error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{routerData.error}</p>
          </div>
        )}

        <Button
          onClick={handleConnect}
          disabled={isConnecting || routerData.loading || !credentials.host || !credentials.username}
          className="w-full"
          variant={routerData.isConnected ? "outline" : "default"}
        >
          {isConnecting || routerData.loading 
            ? 'Connessione...' 
            : routerData.isConnected 
              ? 'Riconnetti' 
              : 'Connetti'
          }
        </Button>
      </CardContent>
    </Card>
  );
}