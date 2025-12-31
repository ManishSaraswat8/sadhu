import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface CustomDialogField {
  id: string;
  label: string;
  type?: "text" | "number" | "switch";
  placeholder?: string;
  defaultValue?: string | number | boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface CustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: Record<string, string | number | boolean>) => void;
  title: string;
  description?: string;
  fields: CustomDialogField[];
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function CustomDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  fields,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: CustomDialogProps) {
  const [values, setValues] = useState<Record<string, string | number | boolean>>({});

  // Initialize values when dialog opens or fields change
  useEffect(() => {
    if (open) {
      const initialValues: Record<string, string | number | boolean> = {};
      fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          initialValues[field.id] = field.defaultValue;
        } else if (field.type === "switch") {
          initialValues[field.id] = false;
        } else if (field.type === "number") {
          initialValues[field.id] = "";
        } else {
          initialValues[field.id] = "";
        }
      });
      setValues(initialValues);
    }
  }, [open, fields]);

  const handleFieldChange = (id: string, value: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleConfirm = () => {
    // Validate required fields
    const missingFields = fields.filter(
      (field) => field.required && (values[field.id] === undefined || values[field.id] === "" || values[field.id] === null)
    );
    
    if (missingFields.length > 0) {
      return; // Don't close if required fields are missing
    }

    onConfirm(values);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setValues({});
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, fieldIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (fieldIndex < fields.length - 1) {
        // Focus next field
        const nextField = document.getElementById(fields[fieldIndex + 1].id);
        nextField?.focus();
      } else {
        // Submit on last field
        handleConfirm();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 py-4">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2">
              {field.type === "switch" ? (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    {field.placeholder && (
                      <p className="text-sm text-muted-foreground">{field.placeholder}</p>
                    )}
                  </div>
                  <Switch
                    id={field.id}
                    checked={values[field.id] as boolean || false}
                    onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
                  />
                </div>
              ) : (
                <>
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Input
                    id={field.id}
                    type={field.type || "text"}
                    value={values[field.id] as string || ""}
                    onChange={(e) => {
                      const value = field.type === "number" 
                        ? (e.target.value === "" ? "" : Number(e.target.value))
                        : e.target.value;
                      handleFieldChange(field.id, value);
                    }}
                    placeholder={field.placeholder}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    autoFocus={index === 0}
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

