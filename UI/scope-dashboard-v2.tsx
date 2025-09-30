import React, { useState } from 'react';
import { Calendar, Users, Settings, ChevronDown, ChevronUp, Plus } from 'lucide-react';

const SCOPEDashboard = () => {
  const [eventsExpanded, setEventsExpanded] = useState(true);
  const [teamExpanded, setTeamExpanded] = useState(true);
  const [trafficExpanded, setTrafficExpanded] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  const events = [
    {
      title: "St. Andrews Cookout",
      date: "Saturday, October 4, 2025",
      time: "10:00 a.m. to 1:30 p.m.",
      supervisor: "Lt. Joe Pounds",
      traffic: "Sgt. Jon Britt",
      assigned: ["Sgt. Henry Timms", "TJ Jaglinski", "Nicole Moulterie", "more..."]
    },
    {
      title: "Trunk-or-Treat",
      date: "Saturday, October 25, 2025",
      time: "3:00 p.m. to 7:00 p.m.",
      supervisor: "Lt. Joe Pounds",
      traffic: "Sgt. Jon Britt",
      assigned: ["Sgt. Henry Timms", "TJ Jaglinski", "Nicole Moulterie", "more..."]
    }
  ];

  const teamAssignments = [
    { name: "Sgt. Henry Timms", event: "St. Andrews Cookout", date: "October 4, 2025", hours: "9:00 a.m. to 2:00 p.m." },
    { name: "TJ Jaglinski", event: "St. Andrews Cookout", date: "October 4, 2025", hours: "11:00 a.m. to 2:00 p.m." },
    { name: "Nicole Moulterie", event: "St. Andrews Cookout", date: "October 4, 2025", hours: "10:00 a.m. to 1:00 p.m." },
    { name: "Tee Martin", event: "St. Andrews Cookout", date: "October 4, 2025", hours: "9:00 a.m. to 2:00 p.m." },
    { name: "Kiara Addison", event: "St. Andrews Cookout", date: "October 4, 2025", hours: "9:00 a.m. to 2:00 p.m." },
    { name: "Sgt. Henry Timms", event: "Trunk-or-Treat", date: "October 25, 2025", hours: "1:00 p.m. to 8:00 p.m." },
    { name: "TJ Jaglinski", event: "Trunk-or-Treat", date: "October 25, 2025", hours: "3:00 p.m. to 7:00 p.m." },
    { name: "Nicole Moulterie", event: "Trunk-or-Treat", date: "October 25, 2025", hours: "2:00 p.m. to 7:00 p.m." },
    { name: "Tee Martin", event: "Trunk-or-Treat", date: "October 25, 2025", hours: "3:00 p.m. to 8:00 p.m." },
    { name: "Kiara Addison", event: "Christmas Tree Lighting", date: "December 1, 2025", hours: "5:00 p.m. to 9:00 p.m." }
  ];

  const CollapsibleSection = ({ title, icon: Icon, isExpanded, onToggle, children }) => (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2.5 px-3 text-sm font-semibold transition-all rounded-lg hover:bg-white/5"
        style={{ color: '#e6e7e8' }}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} />}
          <span>{title}</span>
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {isExpanded && (
        <div className="pl-6 mt-1 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{
      background: 'linear-gradient(135deg, #001a24 0%, #003446 50%, #002233 100%)'
    }}>
      {/* Left Sidebar - Fixed */}
      <aside className="w-80 border-r fixed left-0 top-0 h-screen overflow-y-auto" style={{
        background: 'linear-gradient(180deg, #002535 0%, #003446 100%)',
        borderColor: '#004d66'
      }}>
        <div className="p-6 pb-24">
          {/* Logo Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold italic tracking-wide" style={{ color: '#e9d29a' }}>
              S.C.O.P.E.
            </h1>
            <p className="text-xs uppercase tracking-widest mt-1 opacity-80" style={{ color: '#e6e7e8' }}>
              EVENT ASSIGNMENTS
            </p>
          </div>

          {/* Add Event Button */}
          <button className="w-full py-3 px-4 rounded-xl font-semibold mb-8 transition-all hover:opacity-90 hover:shadow-lg" style={{
            background: 'linear-gradient(135deg, #004d66 0%, #003446 100%)',
            color: '#e6e7e8',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}>
            <Plus size={18} className="inline mr-2" />
            Add Event
          </button>

          {/* Navigation Sections */}
          <nav className="space-y-1">
            <CollapsibleSection
              title="Events"
              icon={Calendar}
              isExpanded={eventsExpanded}
              onToggle={() => setEventsExpanded(!eventsExpanded)}
            >
              {['St. Andrews Cookout', 'Trunk or Treat', 'Christmas Tree Lighting'].map((item, idx) => (
                <div key={idx} className="py-2 px-3 text-sm transition-all cursor-pointer rounded-lg hover:bg-white/5" style={{ color: '#b8b9ba' }}
                  onMouseEnter={(e) => e.target.style.color = '#e6e7e8'}
                  onMouseLeave={(e) => e.target.style.color = '#b8b9ba'}>
                  {item}
                </div>
              ))}
            </CollapsibleSection>

            <CollapsibleSection
              title="Team Members"
              icon={Users}
              isExpanded={teamExpanded}
              onToggle={() => setTeamExpanded(!teamExpanded)}
            >
              {['Capt. Elmer Horn', 'Sgt. Joe Pounds', 'TJ Jaglinski'].map((item, idx) => (
                <div key={idx} className="py-2 px-3 text-sm transition-all cursor-pointer rounded-lg hover:bg-white/5" style={{ color: '#b8b9ba' }}
                  onMouseEnter={(e) => e.target.style.color = '#e6e7e8'}
                  onMouseLeave={(e) => e.target.style.color = '#b8b9ba'}>
                  {item}
                </div>
              ))}
            </CollapsibleSection>

            <CollapsibleSection
              title="Traffic Control"
              isExpanded={trafficExpanded}
              onToggle={() => setTrafficExpanded(!trafficExpanded)}
            >
              <div className="py-2 px-3 text-sm" style={{ color: '#b8b9ba' }}>No items</div>
            </CollapsibleSection>

            <CollapsibleSection
              title="Categories"
              isExpanded={categoriesExpanded}
              onToggle={() => setCategoriesExpanded(!categoriesExpanded)}
            >
              <div className="py-2 px-3 text-sm" style={{ color: '#b8b9ba' }}>No items</div>
            </CollapsibleSection>
          </nav>
        </div>

        {/* Settings Button */}
        <button className="absolute bottom-6 left-6 p-3 rounded-xl transition-all hover:opacity-80 hover:shadow-lg" style={{
          background: 'linear-gradient(135deg, #002535 0%, #003446 100%)',
          color: '#e9d29a',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
        }}>
          <Settings size={20} />
        </button>
      </aside>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 ml-80 overflow-y-auto">
        <div className="p-8 space-y-8 max-w-[1600px]">
          {/* Upcoming Events Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold uppercase tracking-wide italic" style={{ color: '#e9d29a' }}>
                UPCOMING EVENTS...
              </h2>
              <a href="#" className="text-sm transition-all hover:opacity-70 font-medium" style={{ color: '#e9d29a' }}>
                more...
              </a>
            </div>

            <div className="flex flex-wrap gap-5">
              {events.map((event, idx) => (
                <div key={idx} className="rounded-2xl border overflow-hidden transition-all hover:shadow-2xl w-full sm:w-[300px]" style={{
                  borderColor: '#004d66',
                  background: 'linear-gradient(135deg, rgba(0, 52, 70, 0.5) 0%, rgba(0, 36, 53, 0.3) 100%)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  maxWidth: '300px'
                }}>
                  {/* Card Header */}
                  <div className="px-4 py-3 border-b" style={{
                    background: 'linear-gradient(90deg, rgba(0, 52, 70, 0.9) 0%, rgba(0, 77, 102, 0.8) 100%)',
                    borderColor: '#005d7a'
                  }}>
                    <h3 className="text-lg font-bold" style={{ color: '#e9d29a' }}>
                      {event.title}
                    </h3>
                  </div>

                  {/* Card Content */}
                  <div className="p-4" style={{
                    background: 'linear-gradient(180deg, rgba(230, 231, 232, 0.95) 0%, rgba(230, 231, 232, 0.88) 100%)',
                    color: '#1a1a1a'
                  }}>
                    <div className="mb-3 italic text-xs">
                      <div className="font-semibold not-italic mb-1">Date and Time:</div>
                      <div>{event.date}</div>
                      <div>{event.time}</div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="italic">
                        <div className="font-semibold not-italic mb-1">Supervisor</div>
                        <div>{event.supervisor}</div>
                      </div>
                      <div className="italic">
                        <div className="font-semibold not-italic mb-1">Assigned:</div>
                        {event.assigned.map((person, i) => (
                          <div key={i}>{person}</div>
                        ))}
                      </div>
                      <div className="italic">
                        <span className="font-semibold not-italic">Traffic:</span> {event.traffic}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Team Assignments Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold uppercase tracking-wide italic" style={{ color: '#e9d29a' }}>
                TEAM ASSIGNMENTS...
              </h2>
              <button className="py-2.5 px-4 rounded-xl font-semibold transition-all hover:opacity-90 hover:shadow-lg" style={{
                background: 'linear-gradient(135deg, #004d66 0%, #003446 100%)',
                color: '#e6e7e8',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}>
                <Plus size={16} className="inline mr-2" />
                Add Team Member
              </button>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{
              borderColor: '#004d66',
              background: 'linear-gradient(135deg, rgba(0, 52, 70, 0.4) 0%, rgba(0, 36, 53, 0.3) 100%)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
              maxHeight: '500px'
            }}>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table className="w-full">
                  <thead className="sticky top-0 z-10" style={{
                    background: 'linear-gradient(90deg, rgba(0, 52, 70, 0.95) 0%, rgba(0, 77, 102, 0.9) 100%)',
                    borderBottom: '1px solid #004d66'
                  }}>
                    <tr>
                      {['Name', 'Event', 'Date', 'Hours'].map((header, idx) => (
                        <th key={idx} className="px-6 py-4 text-left font-semibold italic text-sm" style={{ color: '#e9d29a' }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamAssignments.map((assignment, idx) => (
                      <tr key={idx} className="transition-all" style={{
                        borderBottom: '1px solid rgba(0, 77, 102, 0.2)',
                        color: '#e6e7e8'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 52, 70, 0.4)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td className="px-6 py-3.5 italic text-sm">{assignment.name}</td>
                        <td className="px-6 py-3.5 italic text-sm">{assignment.event}</td>
                        <td className="px-6 py-3.5 italic text-sm">{assignment.date}</td>
                        <td className="px-6 py-3.5 italic text-sm">{assignment.hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SCOPEDashboard;