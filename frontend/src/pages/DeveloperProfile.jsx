import { Link } from "react-router-dom";

const SKILLS = ["Python", "React", "FastAPI", "PostgreSQL", "Computer Vision", "AI/ML", "Arduino"];

const PROJECTS = [
  {
    name: "Zerat Farm Manager",
    description: "Full-stack farm management app with React, FastAPI, and Supabase.",
    url: "https://zerat-farm-manager.vercel.app",
  },
  {
    name: "Driver Drowsiness Detection System",
    description: "Computer vision system to detect driver fatigue using AI/ML.",
    url: "#",
  },
  {
    name: "TMT InventoryPro (This App)",
    description: "Professional inventory management system with JWT auth, reports, and real-time dashboard.",
    url: "/login",
  },
];

export default function DeveloperProfile() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-navy px-6 py-4 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-sm font-medium">Built by Robel Hagos Mahray</span>
          <Link to="/login" className="text-sm text-accent hover:underline">
            Go to App →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-navy text-4xl font-bold text-white">
              RH
            </div>
            <div className="mt-6 sm:ml-8 sm:mt-0">
              <h1 className="text-3xl font-bold text-navy">Robel Hagos Mahray</h1>
              <p className="mt-1 text-accent font-medium">
                Computer Science Graduate, IUEA Uganda
              </p>
              <p className="mt-4 max-w-xl text-slate-600 leading-relaxed">
                Computer Science graduate from the International University of East Africa, Uganda.
                Originally from Eritrea, rebuilt my life and education in Uganda. Passionate about
                building practical software that solves real problems. This inventory system is a
                demonstration of my full-stack development skills.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-navy">Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {SKILLS.map((skill) => (
                <span key={skill} className="rounded-full bg-navy px-4 py-1.5 text-sm text-white">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-navy">Projects</h2>
            <div className="mt-4 space-y-4">
              {PROJECTS.map((project) => (
                <a
                  key={project.name}
                  href={project.url}
                  target={project.url.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-slate-200 p-5 transition hover:border-accent hover:shadow-md"
                >
                  <h3 className="font-semibold text-navy">{project.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{project.description}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-navy">Contact</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Email: robihagos18@gmail.com</p>
              <p>Phone: +256706780673</p>
              <p>LinkedIn: <a href="https://linkedin.com/in/robi-hagos" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">linkedin.com/in/robi-hagos</a></p>
              <p>GitHub: <a href="https://github.com/Robel-code24" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">github.com/Robel-code24</a></p>
            </div>
          </div>

          <div className="mt-10 rounded-xl bg-navy p-6 text-center text-white">
            <p className="text-lg font-semibold">
              Built by Robel Hagos Mahray — Computer Science Graduate, IUEA Uganda
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block rounded-lg bg-accent px-6 py-2.5 font-medium text-white hover:bg-accent-dark"
            >
              Try the Inventory System
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
