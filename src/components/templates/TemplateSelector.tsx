
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QUIZ_TEMPLATES, QuizTemplate } from '@/types/templates';
import { Quiz, QuizDesign } from '@/types/quiz';
import { Palette } from 'lucide-react';

interface TemplateSelectorProps {
  onSelectTemplate: (design: QuizDesign) => void;
  currentDesign?: QuizDesign;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  currentDesign,
}) => {
  const handleSelectTemplate = (template: QuizTemplate) => {
    onSelectTemplate(template.design);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Escolher Template</h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {QUIZ_TEMPLATES.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </div>
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: template.design.primaryColor }}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground mb-3">{template.preview}</p>
              <div className="flex gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  {template.design.buttonStyle}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.design.cardStyle}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.design.animation}
                </Badge>
              </div>
              <Button
                onClick={() => handleSelectTemplate(template)}
                size="sm"
                className="w-full"
                style={{ backgroundColor: template.design.primaryColor }}
              >
                Usar Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
