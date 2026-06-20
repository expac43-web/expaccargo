import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export const metadata: Metadata = {
  title: "Mentions légales — Express Africa Cargo (EXPAC)",
  description:
    "Mentions légales du site Express Africa Cargo Ltd (EXPAC) : éditeur, coordonnées, hébergement, propriété intellectuelle et protection des données.",
  alternates: { canonical: "https://expaccargo.com/mentions-legales" },
  robots: { index: true, follow: true },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-black uppercase mb-3" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
        {title}
      </h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2" style={{ fontFamily: "var(--font-lato)" }}>
        {children}
      </div>
    </section>
  );
}

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* En-tête */}
        <div className="relative py-14 overflow-hidden" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)" }}>
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="container-custom relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>▪ Informations légales</p>
            <h1 className="text-3xl lg:text-4xl font-black text-white uppercase leading-tight" style={{ fontFamily: "var(--font-montserrat)" }}>
              Mentions légales
            </h1>
          </div>
        </div>

        {/* Contenu */}
        <div className="bg-gray-50 py-14">
          <div className="container-custom">
            <div className="max-w-3xl bg-white rounded-2xl border border-gray-100 shadow-sm p-8 lg:p-10">

              <Section title="Éditeur du site">
                <p>
                  Le présent site est édité par <strong>Express Africa Cargo Ltd (EXPAC)</strong>,
                  commissionnaire agréé en douane.
                </p>
                <p>Registre de commerce (RC) : <strong>CG-BZV-01-2021-B12-00199</strong></p>
                <p>Numéro d&apos;identification unique (NIU) : <strong>M21000002026220</strong></p>
              </Section>

              <Section title="Coordonnées">
                <p><strong>Siège — Brazzaville :</strong> Croisement Av. de la Tsieme / Rue Mbetis, Ouenze SOCECA-SOCEMA, Brazzaville, République du Congo.</p>
                <p>Tél. : +242 05 511 97 11 — +242 05 640 22 77 · <a href="mailto:agence.bz@expaccargo.com" className="text-[#1A3A6B] underline">agence.bz@expaccargo.com</a></p>
                <p><strong>Agence — Pointe-Noire :</strong> Résidence les Palmiers, Bât. C, 2ᵉ étage, Appt Caïman, Av. Germain Bikoumat, Centre-Ville.</p>
                <p>Tél. : +242 06 436 38 82 — +242 05 052 60 43 · <a href="mailto:agence.pn@expaccargo.com" className="text-[#1A3A6B] underline">agence.pn@expaccargo.com</a></p>
                <p>Contact général : <a href="mailto:contact@expaccargo.com" className="text-[#1A3A6B] underline">contact@expaccargo.com</a></p>
              </Section>

              <Section title="Directeur de la publication">
                <p>La Direction d&apos;Express Africa Cargo Ltd (EXPAC).</p>
              </Section>

              <Section title="Hébergement">
                <p>
                  Le site est hébergé par <strong>Vercel Inc.</strong>, San Francisco, Californie,
                  États-Unis — <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-[#1A3A6B] underline">vercel.com</a>.
                </p>
                <p>
                  Les données applicatives (comptes, expéditions, devis, documents) sont stockées sur
                  une infrastructure <strong>Supabase</strong> localisée dans l&apos;Union européenne (Irlande).
                </p>
              </Section>

              <Section title="Propriété intellectuelle">
                <p>
                  L&apos;ensemble des éléments du site (textes, logo, marques, visuels, mise en page) est la
                  propriété d&apos;Express Africa Cargo Ltd, sauf mention contraire. Toute reproduction ou
                  utilisation, totale ou partielle, sans autorisation écrite préalable est interdite.
                </p>
              </Section>

              <Section title="Protection des données personnelles">
                <p>
                  Les informations collectées via les formulaires (demande de devis, contact, création de
                  compte) sont utilisées uniquement pour le traitement de votre demande et le suivi de la
                  relation commerciale. Elles ne sont jamais cédées à des tiers à des fins commerciales.
                </p>
                <p>
                  Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données.
                  Pour l&apos;exercer, écrivez à <a href="mailto:contact@expaccargo.com" className="text-[#1A3A6B] underline">contact@expaccargo.com</a>.
                </p>
              </Section>

              <Section title="Cookies">
                <p>
                  Le site utilise des cookies de mesure d&apos;audience afin d&apos;améliorer l&apos;expérience de
                  navigation. Vous pouvez configurer votre navigateur pour les refuser.
                </p>
              </Section>

              <Section title="Responsabilité">
                <p>
                  Express Africa Cargo s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur ce
                  site. Les estimations de devis fournies en ligne sont indicatives et non contractuelles ;
                  seul un devis établi par nos services fait foi.
                </p>
              </Section>

              <Section title="Droit applicable">
                <p>
                  Les présentes mentions légales sont régies par le droit de la République du Congo. Tout
                  litige relève de la compétence des tribunaux de Brazzaville.
                </p>
              </Section>

              <p className="text-xs text-gray-400 mt-8" style={{ fontFamily: "var(--font-lato)" }}>
                Dernière mise à jour : juin 2026.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
