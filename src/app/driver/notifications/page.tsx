import { getNotifications } from "@/lib/notifications/actions";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function DriverNotificationsPage() {
  const { data: notifications } = await getNotifications();

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Notifications
      </h2>
      <NotificationList initialNotifications={notifications || []} />
    </div>
  );
}
