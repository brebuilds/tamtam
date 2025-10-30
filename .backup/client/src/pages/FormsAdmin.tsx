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
import { FileText, Plus, Edit, Trash2, Eye, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface FormField {
  id: string;
  type: "text" | "number" | "select" | "multiselect" | "date" | "checkbox" | "textarea" | "file" | "barcode";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export default function FormsAdmin() {
  const permissions = usePermissions();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);

  const { data: forms, refetch } = trpc.forms.listTemplates.useQuery();

  if (!permissions.canManageForms) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <Card className="bg-red-500/10 border-red-500/30 p-6">
          <p className="text-red-200">You don't have permission to manage forms.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-400" />
              Custom Forms Management
            </h1>
            <p className="text-gray-400 mt-2">Create and manage custom forms for data collection</p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Form
          </Button>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms?.length === 0 ? (
            <Card className="col-span-full bg-white/5 border-white/10 p-12 text-center">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Forms Yet</h3>
              <p className="text-gray-400 mb-4">Create your first custom form to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Form
              </Button>
            </Card>
          ) : (
            forms?.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                onEdit={() => setEditingForm(form)}
                onRefetch={refetch}
              />
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <FormBuilderDialog
        open={isCreateDialogOpen || !!editingForm}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingForm(null);
        }}
        form={editingForm}
        onSuccess={() => {
          refetch();
          setIsCreateDialogOpen(false);
          setEditingForm(null);
        }}
      />
    </div>
  );
}

function FormCard({ form, onEdit, onRefetch }: any) {
  const deleteForm = trpc.forms.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Form deleted successfully");
      onRefetch();
    }
  });

  const fieldCount = Array.isArray(form.fields) ? form.fields.length : 0;

  return (
    <Card className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{form.name}</h3>
          {form.description && (
            <p className="text-sm text-gray-400">{form.description}</p>
          )}
        </div>
        <div className={`px-2 py-1 rounded text-xs ${
          form.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
        }`}>
          {form.isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Category:</span>
          <span className="text-white">{form.category || 'General'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Fields:</span>
          <span className="text-white">{fieldCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Version:</span>
          <span className="text-white">v{form.version}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="flex-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (confirm(`Delete form "${form.name}"?`)) {
              deleteForm.mutate({ id: form.id });
            }
          }}
          className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>
    </Card>
  );
}

function FormBuilderDialog({ open, onClose, form, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: form?.name || "",
    description: form?.description || "",
    category: form?.category || "product_intake",
    isActive: form?.isActive ?? true,
    fields: form?.fields || []
  });

  const [currentField, setCurrentField] = useState<FormField>({
    id: "",
    type: "text",
    label: "",
    placeholder: "",
    required: false,
    options: []
  });

  const createForm = trpc.forms.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Form created successfully");
      onSuccess();
    }
  });

  const updateForm = trpc.forms.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Form updated successfully");
      onSuccess();
    }
  });

  const addField = () => {
    if (!currentField.label) {
      toast.error("Field label is required");
      return;
    }

    const newField: FormField = {
      ...currentField,
      id: `field_${Date.now()}`
    };

    setFormData({
      ...formData,
      fields: [...formData.fields, newField]
    });

    // Reset current field
    setCurrentField({
      id: "",
      type: "text",
      label: "",
      placeholder: "",
      required: false,
      options: []
    });
  };

  const removeField = (fieldId: string) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((f: FormField) => f.id !== fieldId)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (form) {
      updateForm.mutate({ id: form.id, ...formData });
    } else {
      createForm.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {form ? "Edit Form Template" : "Create Form Template"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label>Form Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., Product Intake Form"
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product_intake">Product Intake</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="quality_control">Quality Control</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>

          {/* Field Builder */}
          <div className="border border-white/10 rounded-lg p-4 bg-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">Add Form Fields</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Field Type</Label>
                <Select value={currentField.type} onValueChange={(v: any) => setCurrentField({ ...currentField, type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="textarea">Text Area</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="barcode">Barcode</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Field Label *</Label>
                <Input
                  value={currentField.label}
                  onChange={(e) => setCurrentField({ ...currentField, label: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="e.g., Serial Number"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={currentField.required}
                onChange={(e) => setCurrentField({ ...currentField, required: e.target.checked })}
                className="w-4 h-4"
              />
              <Label>Required Field</Label>
            </div>

            <Button type="button" onClick={addField} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Field
            </Button>
          </div>

          {/* Fields List */}
          {formData.fields.length > 0 && (
            <div className="border border-white/10 rounded-lg p-4 bg-white/5">
              <h3 className="text-lg font-semibold text-white mb-4">Form Fields ({formData.fields.length})</h3>
              <div className="space-y-2">
                {formData.fields.map((field: FormField, index: number) => (
                  <div key={field.id} className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-semibold text-white">{field.label}</div>
                      <div className="text-sm text-gray-400">
                        Type: {field.type} {field.required && <span className="text-red-400">*</span>}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeField(field.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-2 pt-4">
            <Button type="submit" className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600">
              {form ? "Update Form" : "Create Form"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
