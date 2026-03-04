-- Create franchise-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('franchise-logos', 'franchise-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can read
CREATE POLICY "Authenticated users can read franchise logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'franchise-logos');

-- RLS: system_admin can upload
CREATE POLICY "System admins can upload franchise logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'franchise-logos'
  AND get_my_role() = 'system_admin'
);

-- RLS: system_admin can update (overwrite)
CREATE POLICY "System admins can update franchise logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'franchise-logos'
  AND get_my_role() = 'system_admin'
);

-- RLS: system_admin can delete
CREATE POLICY "System admins can delete franchise logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'franchise-logos'
  AND get_my_role() = 'system_admin'
);
