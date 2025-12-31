-- Create session_type_changes table for tracking changes and notifying users
CREATE TABLE public.session_type_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_type_id UUID REFERENCES public.session_types(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted')),
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  old_data JSONB,
  new_data JSONB,
  change_summary TEXT,
  notify_users BOOLEAN NOT NULL DEFAULT true,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for querying
CREATE INDEX idx_session_type_changes_session_type_id ON public.session_type_changes(session_type_id);
CREATE INDEX idx_session_type_changes_created_at ON public.session_type_changes(created_at DESC);
CREATE INDEX idx_session_type_changes_notify ON public.session_type_changes(notify_users, notified_at) WHERE notify_users = true AND notified_at IS NULL;

-- Enable RLS
ALTER TABLE public.session_type_changes ENABLE ROW LEVEL SECURITY;

-- Everyone can view change logs (for transparency)
CREATE POLICY "Anyone can view session type changes"
ON public.session_type_changes
FOR SELECT
USING (true);

-- Only admins can create change logs
CREATE POLICY "Admins can create change logs"
ON public.session_type_changes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create user_notifications table for notifying users about changes
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('session_type_change', 'price_change', 'system_update', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- Can reference session_type_changes.id or other entities
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON public.user_notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_user_notifications_created_at ON public.user_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.user_notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can create notifications
CREATE POLICY "Admins can create notifications"
ON public.user_notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Function to create notifications for all active users when session type changes
CREATE OR REPLACE FUNCTION public.notify_users_session_type_change()
RETURNS TRIGGER AS $$
DECLARE
  change_record RECORD;
  user_record RECORD;
BEGIN
  -- Get the change record
  SELECT * INTO change_record
  FROM public.session_type_changes
  WHERE id = NEW.id AND notify_users = true AND notified_at IS NULL;
  
  IF change_record IS NOT NULL THEN
    -- Create notifications for all active users
    FOR user_record IN 
      SELECT id FROM auth.users WHERE deleted_at IS NULL
    LOOP
      INSERT INTO public.user_notifications (
        user_id,
        notification_type,
        title,
        message,
        related_id
      ) VALUES (
        user_record.id,
        'session_type_change',
        CASE 
          WHEN change_record.change_type = 'created' THEN 'New Session Type Available'
          WHEN change_record.change_type = 'updated' THEN 'Session Type Updated'
          WHEN change_record.change_type = 'deleted' THEN 'Session Type Removed'
        END,
        COALESCE(change_record.change_summary, 'A session type has been modified.'),
        change_record.id
      );
    END LOOP;
    
    -- Mark as notified
    UPDATE public.session_type_changes
    SET notified_at = now()
    WHERE id = change_record.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to notify users when change log is created
CREATE TRIGGER notify_users_on_session_type_change
AFTER INSERT ON public.session_type_changes
FOR EACH ROW
WHEN (NEW.notify_users = true)
EXECUTE FUNCTION public.notify_users_session_type_change();

