import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Send, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export default function Forms() {
  const permissions = usePermissions();
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: forms } = trpc.forms.listTemplates.useQuery();
  const { data: submissions } = trpc.forms.listSubmissions.useQuery();

  const submitForm = trpc.forms.submitForm.useMutation({
    onSuccess: () => {
      toast.success("Form submitted successfully");
      setSelectedForm(null);
      setFormData({});
    },
    onError: (error) => {
      toast.error(`Failed to submit form: ${error.message}`);
    }
  });

  if (!permissions.canFillForms) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <Card className="bg-red-500/10 border-red-500/30 p-6">
          <p className="text-red-200">You don't have permission to fill forms.</p>
        </Card>
      </div>
    );
  }

  const activeForms = forms?.filter(f => f.isActive) || [];
  const mySubmissions = submissions?.slice(0, 10) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const fields = selectedForm.fields as FormField[];
    for (const field of fields) {
      if (field.required && !formData[field.id]) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    submitForm.mutate({
      templateId: selectedForm.id,
      data: formData
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-400" />
            Forms
          </h1>
          <p className="text-gray-400 mt-2">Fill out and submit custom forms</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Forms */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">Available Forms</h2>
            {activeForms.length === 0 ? (
              <Card className="bg-white/5 border-white/10 p-8 text-center">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No active forms available</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeForms.map((form) => (
                  <Card
                    key={form.id}
                    className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedForm(form);
                      setFormData({});
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <FileText className="w-6 h-6 text-indigo-400" />
                      <span className="text-xs text-gray-400">{form.category}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{form.name}</h3>
                    {form.description && (
                      <p className="text-sm text-gray-400 mb-3">{form.description}</p>
                    )}
                    <div className="text-sm text-gray-500">
                      {Array.isArray(form.fields) ? form.fields.length : 0} fields
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Recent Submissions</h2>
            <div className="space-y-3">
              {mySubmissions.length === 0 ? (
                <Card className="bg-white/5 border-white/10 p-6 text-center">
                  <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No submissions yet</p>
                </Card>
              ) : (
                mySubmissions.map((sub) => (
                  <Card key={sub.id} className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white mb-1">
                          Form Submission
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Fill Dialog */}
      {selectedForm && (
        <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
          <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedForm.name}</DialogTitle>
              {selectedForm.description && (
                <p className="text-gray-400">{selectedForm.description}</p>
              )}
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {(selectedForm.fields as FormField[]).map((field) => (
                <div key={field.id}>
                  <Label>
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </Label>

                  {field.type === 'text' && (
                    <Input
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      className="bg-white/5 border-white/10 text-white"
                      required={field.required}
                    />
                  )}

                  {field.type === 'number' && (
                    <Input
                      type="number"
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      className="bg-white/5 border-white/10 text-white"
                      required={field.required}
                    />
                  )}

                  {field.type === 'textarea' && (
                    <Textarea
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      placeholder={field.placeholder}
                      className="bg-white/5 border-white/10 text-white"
                      rows={3}
                      required={field.required}
                    />
                  )}

                  {field.type === 'date' && (
                    <Input
                      type="date"
                      value={formData[field.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      required={field.required}
                    />
                  )}

                  {field.type === 'checkbox' && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        checked={formData[field.id] || false}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-300">{field.placeholder || 'Check if applicable'}</span>
                    </div>
                  )}

                  {field.type === 'select' && field.options && (
                    <Select value={formData[field.id]} onValueChange={(v) => setFormData({ ...formData, [field.id]: v })}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Form
                </Button>
                <Button type="button" variant="outline" onClick={() => setSelectedForm(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    submitted: 'bg-blue-500/20 text-blue-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || colors.submitted}`}>
      {status}
    </span>
  );
}
