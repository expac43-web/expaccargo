import InternalDocumentsManager from "@/components/admin/InternalDocumentsManager";

/**
 * Documents internes côté gérant — même outil que l'admin : le gérant dépose
 * des documents pour les agents et les autres gérants. Les routes /api/admin/*
 * utilisées autorisent déjà le rôle MANAGER.
 */
export default function GerantDocumentsInternesPage() {
  return <InternalDocumentsManager />;
}
