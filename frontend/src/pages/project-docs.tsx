import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Palette, Code } from 'lucide-react';

const DOC_CATEGORIES = [
  {
    key: 'planning',
    icon: FileText,
  },
  {
    key: 'design',
    icon: Palette,
  },
  {
    key: 'technology',
    icon: Code,
  },
] as const;

export function ProjectDocs() {
  const { t } = useTranslation(['docs', 'common']);

  return (
    <div className="space-y-6 p-8 pb-16 md:pb-8 h-full overflow-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('docs:title')}</h1>
          <p className="text-muted-foreground">{t('docs:subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {DOC_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.key}
              className="hover:shadow-md transition-shadow cursor-pointer border"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <CardTitle className="text-xl">
                    {t(`docs:categories.${category.key}.title`)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t('docs:documentList')}
                  </h3>
                  <div className="text-sm text-muted-foreground py-8 text-center">
                    {t('docs:noDocuments')}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
