import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Calendar,
  FileText,
  Tag,
  AlertCircle,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createTask, updateTask } from "@/store/slices/tasksSlice";
import type { TaskTemplate } from "@shared/api";

interface TaskWizardProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
  editTask?: TaskTemplate | null;
}

const validationSchema = Yup.object({
  title: Yup.string().required("Task title is required"),
  description: Yup.string(),
  task_type: Yup.string().required("Task type is required"),
  priority: Yup.string().required("Priority is required"),
  default_due_days: Yup.number().nullable().min(0, "Must be 0 or positive"),
  is_active: Yup.boolean(),
});

const taskTypes = [
  { value: "document_collection", label: "Document Collection" },
  { value: "document_verification", label: "Document Verification" },
  { value: "credit_check", label: "Credit Check" },
  { value: "income_verification", label: "Income Verification" },
  { value: "appraisal_order", label: "Appraisal Order" },
  { value: "title_search", label: "Title Search" },
  { value: "underwriting_review", label: "Underwriting Review" },
  { value: "conditional_approval", label: "Conditional Approval" },
  { value: "final_approval", label: "Final Approval" },
  { value: "closing_coordination", label: "Closing Coordination" },
  { value: "follow_up", label: "Follow Up" },
  { value: "client_communication", label: "Client Communication" },
  { value: "custom", label: "Custom Task" },
];

const TaskWizard: React.FC<TaskWizardProps> = ({
  open,
  onClose,
  onTaskCreated,
  editTask,
}) => {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!editTask;

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      task_type: "",
      priority: "medium",
      default_due_days: null as number | null,
      is_active: true,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        if (isEditMode) {
          await dispatch(updateTask({ id: editTask.id, ...values })).unwrap();
        } else {
          await dispatch(createTask(values)).unwrap();
        }
        formik.resetForm();
        onTaskCreated?.();
        onClose();
      } catch (error) {
        console.error(
          `Failed to ${isEditMode ? "update" : "create"} task:`,
          error,
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (editTask && open) {
      formik.setValues({
        title: editTask.title || "",
        description: editTask.description || "",
        task_type: editTask.task_type || "",
        priority: editTask.priority || "medium",
        default_due_days: editTask.default_due_days ?? null,
        is_active: editTask.is_active ?? true,
      });
    } else if (!open) {
      formik.resetForm();
    }
  }, [editTask, open]);

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="rounded-full bg-emerald-500/10 p-2">
              {isEditMode ? (
                <Edit className="h-5 w-5 text-emerald-500" />
              ) : (
                <Plus className="h-5 w-5 text-emerald-500" />
              )}
            </div>
            {isEditMode ? "Edit Task Template" : "Create Task Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update task template details"
              : "Create a task template that will be used in loan workflows"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="space-y-6 mt-4">
          {/* Task Type */}
          <div className="space-y-2">
            <Label htmlFor="task_type" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Task Type
            </Label>
            <Select
              value={formik.values.task_type}
              onValueChange={(value) => {
                formik.setFieldValue("task_type", value);
                // Auto-populate title based on task type
                const selectedType = taskTypes.find((t) => t.value === value);
                if (selectedType && !formik.values.title) {
                  formik.setFieldValue("title", selectedType.label);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                {taskTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formik.touched.task_type && formik.errors.task_type && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {formik.errors.task_type}
              </p>
            )}
          </div>

          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Template Title
            </Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Collect W-2 forms from client"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={
                formik.touched.title && formik.errors.title
                  ? "border-destructive"
                  : ""
              }
            />
            {formik.touched.title && formik.errors.title && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {formik.errors.title}
              </p>
            )}
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Add detailed instructions or notes for this task template..."
              value={formik.values.description}
              onChange={formik.handleChange}
              rows={4}
            />
          </div>

          {/* Priority & Default Due Days */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formik.values.priority}
                onValueChange={(value) =>
                  formik.setFieldValue("priority", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <Badge className={getPriorityColor("low")}>Low</Badge>
                  </SelectItem>
                  <SelectItem value="medium">
                    <Badge className={getPriorityColor("medium")}>Medium</Badge>
                  </SelectItem>
                  <SelectItem value="high">
                    <Badge className={getPriorityColor("high")}>High</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="default_due_days"
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Default Due Days
              </Label>
              <Input
                id="default_due_days"
                name="default_due_days"
                type="number"
                min="0"
                placeholder="e.g., 7"
                value={formik.values.default_due_days ?? ""}
                onChange={(e) =>
                  formik.setFieldValue(
                    "default_due_days",
                    e.target.value ? parseInt(e.target.value) : null,
                  )
                }
              />
              {formik.touched.default_due_days &&
                formik.errors.default_due_days && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formik.errors.default_due_days}
                  </p>
                )}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formik.values.is_active}
              onChange={formik.handleChange}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active (will be used in new loan workflows)
            </Label>
          </div>

          {/* Preview */}
          <AnimatePresence>
            {formik.values.title && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 p-4"
              >
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Template Preview:
                </p>
                <div className="space-y-2">
                  <p className="font-semibold">{formik.values.title}</p>
                  {formik.values.description && (
                    <p className="text-sm text-muted-foreground">
                      {formik.values.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getPriorityColor(formik.values.priority)}>
                      {formik.values.priority}
                    </Badge>
                    {formik.values.task_type && (
                      <Badge variant="outline">
                        {
                          taskTypes.find(
                            (t) => t.value === formik.values.task_type,
                          )?.label
                        }
                      </Badge>
                    )}
                    {formik.values.default_due_days && (
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        <Calendar className="h-3 w-3" />
                        Due in {formik.values.default_due_days} days
                      </Badge>
                    )}
                    <Badge
                      variant={
                        formik.values.is_active ? "default" : "secondary"
                      }
                    >
                      {formik.values.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formik.isValid}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="mr-2"
                  >
                    <Plus className="h-4 w-4" />
                  </motion.div>
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {isEditMode ? "Update Template" : "Create Template"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskWizard;
