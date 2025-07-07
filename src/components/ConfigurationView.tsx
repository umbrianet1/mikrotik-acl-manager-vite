import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RouterData } from '@/types/mikrotik';

interface ConfigurationViewProps {
  routerData: RouterData;
  routerNumber: number;
}

export function ConfigurationView({ routerData, routerNumber }: ConfigurationViewProps) {
  if (!routerData.isConnected) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Connetti il Router {routerNumber} per visualizzare la configurazione
          </p>
        </CardContent>
      </Card>
    );
  }

  const getActionBadge = (action: string) => {
    const variants: Record<string, string> = {
      'accept': 'bg-success text-success-foreground',
      'drop': 'bg-destructive text-destructive-foreground',
      'reject': 'bg-warning text-warning-foreground',
      'return': 'bg-secondary text-secondary-foreground'
    };
    
    return (
      <Badge 
        variant="outline" 
        className={variants[action] || 'bg-muted text-muted-foreground'}
      >
        {action}
      </Badge>
    );
  };

  const getChainBadge = (chain: string) => {
    const variants: Record<string, string> = {
      'input': 'bg-primary text-primary-foreground',
      'forward': 'bg-accent text-accent-foreground', 
      'output': 'bg-secondary text-secondary-foreground'
    };
    
    return (
      <Badge 
        variant="outline"
        className={variants[chain] || 'bg-muted text-muted-foreground'}
      >
        {chain}
      </Badge>
    );
  };

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{routerData.credentials.name || `Router ${routerNumber}`}</span>
          <Badge variant="default" className="bg-success text-success-foreground">
            Connesso
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {routerData.credentials.host}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="address-lists" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="address-lists">
              Address Lists ({routerData.addressLists.length})
            </TabsTrigger>
            <TabsTrigger value="firewall-rules">
              Firewall Rules ({routerData.firewallRules.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="address-lists" className="mt-4">
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {routerData.addressLists.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nessuna address list trovata
                  </p>
                ) : (
                  routerData.addressLists.map((item) => (
                    <div
                      key={item['.id']}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.list}</Badge>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {item.address}
                            </code>
                          </div>
                          {item.comment && (
                            <p className="text-sm text-muted-foreground">
                              {item.comment}
                            </p>
                          )}
                        </div>
                        {item.disabled && (
                          <Badge variant="secondary">Disabilitato</Badge>
                        )}
                      </div>
                      {item.timeout && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Timeout: {item.timeout}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="firewall-rules" className="mt-4">
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {routerData.firewallRules.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nessuna regola firewall trovata
                  </p>
                ) : (
                  routerData.firewallRules.map((rule) => (
                    <div
                      key={rule['.id']}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getChainBadge(rule.chain)}
                          {getActionBadge(rule.action)}
                        </div>
                        {rule.disabled && (
                          <Badge variant="secondary">Disabilitato</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {rule['src-address'] && (
                          <div>
                            <span className="text-muted-foreground">Src:</span>
                            <code className="ml-1 bg-muted px-1 rounded">
                              {rule['src-address']}
                            </code>
                          </div>
                        )}
                        {rule['dst-address'] && (
                          <div>
                            <span className="text-muted-foreground">Dst:</span>
                            <code className="ml-1 bg-muted px-1 rounded">
                              {rule['dst-address']}
                            </code>
                          </div>
                        )}
                        {rule['src-address-list'] && (
                          <div>
                            <span className="text-muted-foreground">Src List:</span>
                            <Badge variant="outline" className="ml-1 text-xs">
                              {rule['src-address-list']}
                            </Badge>
                          </div>
                        )}
                        {rule['dst-address-list'] && (
                          <div>
                            <span className="text-muted-foreground">Dst List:</span>
                            <Badge variant="outline" className="ml-1 text-xs">
                              {rule['dst-address-list']}
                            </Badge>
                          </div>
                        )}
                        {rule.protocol && (
                          <div>
                            <span className="text-muted-foreground">Protocol:</span>
                            <span className="ml-1">{rule.protocol}</span>
                          </div>
                        )}
                        {(rule['src-port'] || rule['dst-port']) && (
                          <div>
                            <span className="text-muted-foreground">Ports:</span>
                            <span className="ml-1">
                              {rule['src-port'] && `src:${rule['src-port']}`}
                              {rule['src-port'] && rule['dst-port'] && ' → '}
                              {rule['dst-port'] && `dst:${rule['dst-port']}`}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {rule.comment && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          {rule.comment}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}