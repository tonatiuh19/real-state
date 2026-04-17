import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, CalendarClock } from "lucide-react";
import axios from "axios";

interface RescheduleInfo {
  broker_public_token: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  old_meeting_date: string;
  old_meeting_time: string;
}

export default function SchedulerReschedule() {
  const { bookingToken } = useParams<{ bookingToken: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "confirming" | "error">(
    "loading",
  );
  const [info, setInfo] = useState<RescheduleInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingToken) return;
    // Fetch meeting info first to show a confirmation screen
    axios
      .get<{ success: boolean; error?: string } & Partial<RescheduleInfo>>(
        `/api/public/scheduler/reschedule/${bookingToken}`,
      )
      .then(({ data }) => {
        if (!data.success) {
          setError(data.error ?? "Booking not found");
          setStatus("error");
          return;
        }
        setInfo({
          broker_public_token: data.broker_public_token!,
          client_name: data.client_name!,
          client_email: data.client_email!,
          client_phone: data.client_phone ?? null,
          old_meeting_date: data.old_meeting_date!,
          old_meeting_time: data.old_meeting_time!,
        });
        setStatus("confirming");
      })
      .catch(() => {
        setError("Could not load booking information. Please try again.");
        setStatus("error");
      });
  }, [bookingToken]);

  const handleConfirm = async () => {
    if (!info || !bookingToken) return;
    setStatus("loading");
    try {
      const { data } = await axios.post<{
        success: boolean;
        broker_public_token?: string;
        error?: string;
      }>(`/api/public/scheduler/reschedule/${bookingToken}`);
      if (!data.success) {
        setError(data.error ?? "Failed to cancel existing booking");
        setStatus("error");
        return;
      }
      // Redirect to the broker's scheduler with prefill state
      navigate(`/scheduler/${data.broker_public_token}`, {
        state: {
          prefill: {
            client_name: info.client_name,
            client_email: info.client_email,
            client_phone: info.client_phone,
          },
        },
        replace: true,
      });
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  };

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Loading your booking…</p>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-lg font-bold text-foreground">
              Unable to Reschedule
            </h2>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="text-sm text-primary hover:underline font-medium"
            >
              Return home
            </button>
          </div>
        )}

        {status === "confirming" && info && (
          <div className="rounded-2xl border border-border bg-card p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <CalendarClock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Reschedule Meeting
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your existing slot will be released
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Current booking
              </p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">
                  {formatDate(info.old_meeting_date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium text-foreground">
                  {formatTime(info.old_meeting_time)}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Clicking <strong>Pick a New Time</strong> will cancel your current
              appointment and open the scheduler so you can choose a new slot.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Pick a New Time
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full h-10 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Keep my current appointment
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
