import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, Download } from 'lucide-react';

interface MigrationResult {
  email: string;
  status: 'success' | 'failed';
  error?: string;
  userId?: string;
}

interface Credential {
  fullName: string;
  email: string;
  tempPassword: string;
  trainerName: string;
}

export function RepMigration() {
  const [csvData, setCsvData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [summary, setSummary] = useState<{ total: number; successful: number; failed: number } | null>(null);
  const { toast } = useToast();

  const handleMigration = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Please paste the CSV data",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResults([]);
    setCredentials([]);
    setSummary(null);

    try {
      const { data, error } = await supabase.functions.invoke('migrate-reps', {
        body: {
          csvData: csvData.trim(),
          skipEzText: true
        }
      });

      if (error) {
        throw error;
      }

      setResults(data.results || []);
      setCredentials(data.credentials || []);
      setSummary(data.summary);

      toast({
        title: "Migration Complete",
        description: `${data.summary.successful} reps migrated successfully, ${data.summary.failed} failed`,
        variant: data.summary.failed > 0 ? "destructive" : "default",
      });

    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to migrate reps",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCredentials = () => {
    if (credentials.length === 0) return;

    const csvContent = [
      'Full Name,Email,Temporary Password,Trainer Name',
      ...credentials.map(cred => 
        `"${cred.fullName}","${cred.email}","${cred.tempPassword}","${cred.trainerName}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rep-credentials.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const defaultCsv = `Full Name,Email,Phone Number,Assigned Field Trainer,Birthday,Date Added
Adalina Sarber,sarberadalina@gmail.com,15746069107,Natalie Nell,10/4/1998,5/31/2025
Alexander Watson,alexnwatson15@gmail.com,12099056878,Christina Yeager,5/24/2000,7/11/2025
Alisha Evans,alishaglenn5578@gmail.com,16143641750,Natalie Nell,11/13/1978,6/4/2025
Amanda Wolfe,Futurewolfe2019@gmail.com,19013711843,Kathy Seehafer,11/23/1993,1/22/2025
Anna Lippart,anna.lippart@gmail.com,7154091478,Ruth Sattler,,7/22/2025
Bernice Green,bernice.deprince100@gmail.com,14705626514,Jennifer Stylinski,2/13/2000,3/8/2025
Brittany Martin,bamartin413@gmail.com,13018039639,Jeffrey Feldhusen,7/31/1992,7/9/2025
Carina Traina,cltraina1926@gmail.com,15166064069,Jennifer Stylinski,7/26/2000,7/19/2025
Carissa Brandemuehl,cbrandemuehl@ymail.com,12622814494,Jeffrey Feldhusen,4/19/1994,5/9/2025
Carley Skille,skille.a.carley11@gmail.com,17159349586,Jamie Bonnin,2/20/1996,6/10/2025
Carolyn Buch,Idntrdspm@outlook.com,19106051640,Jennifer Stylinski,9/18/1979,6/16/2025
Cheryl Mckelvey,lilfrogmom39@gmail.com,13034783046,Jennifer Stylinski,4/6/1988,11/19/2024
Chris McKenzie,cdmckenzie1978@gmail.com,16824159300,Jennifer Stylinski,7/22/1978,2/17/2025
Crystal Craddock,crystalwalker600@gmail.com,6158794836,Adele Martin,,7/22/2025
Dianita (Paris) Tucker-White,beautifulday79@gmail.com,16158186885,Adele Martin,5/3/1979,7/11/2025
Diu Nyuon,diutayn@gmail.com,16514321981,Jennifer Stylinski,1/1/1984,7/20/2025
Donald Clupper,sdclupper@yahoo.com,15857217942,Jennifer Stylinski,5/22/1971,7/10/2025
Elijah Pape,elijahpape05@gmail.com,13155307134,Natalie Nell,3/2/1994,7/5/2025
Greta Wempe,gretawempe182@gmail.com,19205050894,Jeffrey Feldhusen,3/23/1982,7/1/2025
Heather Schneider,Hschneider9021@gmail.com,12626270870,Natalie Nell,9/15/1990,5/22/2025
Helen Dobson,helenlynch83@gmail.com,19203752075,Jeffrey Feldhusen,7/4/1983,7/13/2025
Jasmine Lincoln,driverjl@icloud.com,16083432021,Jeffrey Feldhusen,11/8/1993,6/25/2025
Jessica Rich,jsrich76@yahoo.com,17813083784,Christina Yeager,10/3/1976,6/14/2025
JoAnna Melendez,joanna.melendez@ymail.com,14143649114,Jennifer Stylinski,10/16/1980,4/12/2025
Joy Spiewak,JoySpiewak@gmail.com,12628936518,Jennifer Stylinski,1/5/1969,5/9/2024
Julie Regan,rainbows4always@gmail.com,17814928756,Jennifer Stylinski,10-24-1072,6/29/2025
Kari Allen,karikallen@gmail.com,18082649809,Ruth Sattler,6/25/1978,3/1/2025
Katy Laird,lairdkaty44@gmail.com,19018328821,Jamie Bonnin,10/8/2001,6/16/2025
Kerry Kennedy,kerrykennedy257@gmail.com,19208838212,Kathy Seehafer,4/11/1981,4/19/2024
Latashia Davis,davislatashial@gmail.com,16146038570,Adele Martin,10/9/1976,7/10/2025
Lauren Shea,shea.lauren@gmail.com,13023540364,Jennifer Stylinski,9/23/1980,5/9/2024
Layla Butler,layla.butler79@gmail.com,16016669463,Jamie Bonnin,8/15/1979,6/24/2025
Lois Whichlacz,loisjw52@gmail.com,17157331563,Kathy Seehafer,2/6/1952,5/21/2025
Lori Mallory,lori.mallory24@gmail.com,18067870083,Jennifer Stylinski,11/24/1970,3/22/2025
Mark Mansur,mjmmansur@comcast.net,16512852915,Ruth Sattler,1/19/1970,7/7/2025
Marlene Drollinger,marlene85olive@gmail.com,17157128510,Jeffrey Feldhusen,8/27/1985,7/10/2025
Marta  Tawney,mtawney001@gmail.com,5854144235,Jennifer Stylinski,,7/22/2025
Mary Robbins,marymageerobbins@gmail.com,18288554117,Jennifer Stylinski,6/2/1968,6/16/2025
Miguel Baldemor,baldemor90@gmail.com,14144390706,Kathy Seehafer,12/15/1990,4/19/2024
Renea White,reneawhite0015@gmail.com,14177188785,Kathy Seehafer,8/30/1990,7/11/2025
Robert Tawney,tawneyrob@gmail.com,15853190369,Jennifer Stylinski,10/22/1968,2/9/2025
Roberta Monroe,robertamonroebiz@gmail.com,19514971423,Christina Yeager,11/13/1978,5/23/2025
Sanders Faught,sandersfaught@gmail.com,12628041789,Natalie Nell,11/19/2001,7/18/2025
Sarah Hebbe,hebbesarah@gmail.com,17153029013,Kathy Seehafer,9/11/1958,5/14/2024
Sarah White,whitesarah16@gmail.com,12704386756,Jennifer Stylinski,9/4/1980,1/12/2025
Sean Shipps,sjshipps@gmail.com,13038037974,Jennifer Stylinski,7/3/1973,11/16/2024
Shannon Bryer,amos33arbc@gmail.com,5154476059,Christina Yeager,,7/22/2025
Sierra Kelly,06kellykelly@gmail.com,16095051828,Natalie Nell,4/6/1996,6/11/2025
Skyler Belles,skyler.orion10@gmail.com,19188636336,Natalie Nell,9/8/1987,5/26/2025
Tammy Sue Davis,tsdavisagent@gmail.com,18082379125,Christina Yeager,5/14/1974,4/5/2025
Tiffany Ilconich,tiffany.ilconich@icloud.com,12675765821,Jennifer Stylinski,10/31/1996,6/22/2025
Victoria Moran,missvivix3@gmail.com,15127621018,Christina Yeager,2/3/2000,7/5/2025
Victoria Spinks,deelrub77@yahoo.com,14143910796,Debbie Goldsberry,12/15/1964,7/11/2025
Vivian Fontes,vivianfontes101@gmail.com,12016003246,Jeffrey Feldhusen,4/11/1976,7/20/2025
Zariah Clay,clayzariah1@gmail.com,14706596035,Jennifer Stylinski,2/22/2001,7/3/2025`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rep Migration Tool</CardTitle>
          <CardDescription>
            Migrate existing reps from CSV data. This will create user accounts with temporary passwords
            and skip EZ Text integration (since they're already in EZ Text).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">CSV Data</label>
            <Textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="Paste your CSV data here..."
              className="mt-1 min-h-[200px]"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setCsvData(defaultCsv)}
            >
              Load Sample Data (55 reps)
            </Button>
          </div>

          <Button
            onClick={handleMigration}
            disabled={isLoading || !csvData.trim()}
            className="w-full"
          >
            {isLoading ? 'Migrating...' : 'Start Migration'}
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {summary.failed === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-600" />
              )}
              Migration Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>

            {credentials.length > 0 && (
              <Button
                onClick={downloadCredentials}
                className="w-full"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Credentials CSV
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <Alert key={index} variant={result.status === 'success' ? 'default' : 'destructive'}>
                  <AlertDescription>
                    <strong>{result.email}</strong>: {result.status}
                    {result.error && ` - ${result.error}`}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}