import TaskDetail from "@/features/dashboard/task-detail";

interface TaskDetailPageProps {
  params: {
    id: string;
  };
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  return <TaskDetail id={params.id} />;
}
