import jsPDF from 'jspdf';
import type { Event, TeamMember, TeamAssignment, TrafficControl, Supervisor, EventTask, TaskCategory } from '@/types';

interface PDFExportData {
  event: Event;
  teamMembers: TeamMember[];
  teamAssignments?: TeamAssignment[];
  trafficControls?: TrafficControl[];
  supervisors?: Supervisor[];
  eventTasks?: EventTask[];
  taskCategories?: TaskCategory[];
}

const safeText = (value: string | null | undefined, fallback = 'Not specified'): string => {
  if (!value) return fallback;
  const trimmed = typeof value === 'string' ? value.trim() : value;
  return trimmed.length ? trimmed : fallback;
};

const safeDate = (value: string | null | undefined): string => {
  if (!value) return 'Date TBD';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Date TBD' : parsed.toLocaleDateString();
};

const safeTimeRange = (start: string | null | undefined, end: string | null | undefined): string => {
  if (!start && !end) return 'Time TBD';
  return `${start || 'TBD'} – ${end || 'TBD'}`;
};

export function exportEventToPDF(data: PDFExportData): void {
  const { event, teamMembers, teamAssignments = [], trafficControls = [], supervisors = [], eventTasks = [], taskCategories = [] } = data;

  const doc = new jsPDF();
  let yPos = 20;
  const leftMargin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const rightMargin = pageWidth - 20;
  const maxWidth = rightMargin - leftMargin;

  // Helper functions
  const addTitle = (text: string) => {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(text, leftMargin, yPos);
    yPos += 10;
    doc.setDrawColor(0, 0, 0);
    doc.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 15;
  };

  const addSection = (title: string) => {
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, leftMargin, yPos);
    yPos += 10;
  };

  const addField = (label: string, value: string) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', leftMargin, yPos);
    doc.setFont('helvetica', 'normal');

    const labelWidth = doc.getTextWidth(label + ': ');
    const availableWidth = maxWidth - labelWidth;
    const lines = doc.splitTextToSize(value, availableWidth);

    doc.text(lines, leftMargin + labelWidth, yPos);
    yPos += lines.length * 5;
  };

  const addTableHeader = (headers: string[], columnWidths: number[]) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(leftMargin, yPos - 5, maxWidth, 8, 'F');

    let xPos = leftMargin + 5;
    headers.forEach((header, index) => {
      doc.text(header, xPos, yPos);
      xPos += columnWidths[index];
    });
    yPos += 10;
  };

  const addTableRow = (values: string[], columnWidths: number[]) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    let xPos = leftMargin + 5;
    const maxLines = Math.max(...values.map((value, index) => {
      const lines = doc.splitTextToSize(value, columnWidths[index] - 10);
      return lines.length;
    }));

    values.forEach((value, index) => {
      const lines = doc.splitTextToSize(value, columnWidths[index] - 10);
      lines.forEach((line: string, lineIndex: number) => {
        doc.text(line, xPos, yPos + (lineIndex * 4));
      });
      xPos += columnWidths[index];
    });

    yPos += maxLines * 4 + 5;
  };

  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPos + requiredSpace > doc.internal.pageSize.height - 20) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Document header
  addTitle('Event Staff Assignment Sheet');

  // Event Information
  addSection('Event Information');
  addField('Event Name', safeText(event.event_name));
  addField('Date', safeDate(event.event_date));
  addField('Location', safeText(event.location));
  addField('Event Time', safeTimeRange(event.start_time, event.end_time));
  addField('Team Meet Time', safeText(event.team_meet_time, 'Time TBD'));
  addField('Meet Location', safeText(event.meet_location));
  addField('Prepared By', safeText(event.prepared_by));
  addField('Date Prepared', safeDate(event.prepared_date));

  if (event.notes) {
    addField('Notes', safeText(event.notes));
  }

  // Supervisors
  checkPageBreak(40);
  addSection('Supervisors');
  if (supervisors.length > 0) {
    supervisors.forEach((supervisor, index) => {
      addField(`Supervisor ${index + 1}`, safeText(supervisor.supervisor_name, 'Unnamed supervisor'));
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('No supervisors assigned', leftMargin, yPos);
    yPos += 10;
  }

  // Pre-Event Tasks Summary
  if (eventTasks.length > 0) {
    checkPageBreak(80);
    addSection('Pre-Event Tasks Summary');

    const totalTasks = eventTasks.length;
    const completedTasks = eventTasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = eventTasks.filter(t => t.status === 'In Progress').length;
    const notStartedTasks = eventTasks.filter(t => t.status === 'Not Started').length;
    const readinessScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueTasks = eventTasks.filter(task => {
      if (task.status === 'Completed' || !task.due_date) return false;
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    addField('Total Tasks', String(totalTasks));
    addField('Completed', `${completedTasks} (${readinessScore}%)`);
    addField('In Progress', String(inProgressTasks));
    addField('Not Started', String(notStartedTasks));

    if (overdueTasks.length > 0) {
      doc.setTextColor(220, 38, 38);
      addField('Overdue Tasks', String(overdueTasks.length));
      doc.setTextColor(0, 0, 0);
    }

    yPos += 5;

    const tasksByStatus = [
      { status: 'Completed', tasks: eventTasks.filter(t => t.status === 'Completed'), color: [34, 197, 94] },
      { status: 'In Progress', tasks: eventTasks.filter(t => t.status === 'In Progress'), color: [59, 130, 246] },
      { status: 'Not Started', tasks: eventTasks.filter(t => t.status === 'Not Started'), color: [156, 163, 175] }
    ];

    tasksByStatus.forEach(({ status, tasks, color }) => {
      if (tasks.length > 0) {
        checkPageBreak(30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(`${status} (${tasks.length})`, leftMargin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 8;

        tasks.forEach(task => {
          checkPageBreak(20);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');

          const isOverdue = task.status !== 'Completed' && task.due_date && new Date(task.due_date) < today;
          if (isOverdue) {
            doc.setTextColor(220, 38, 38);
          }

          doc.text(`• ${task.title}`, leftMargin + 5, yPos);
          yPos += 5;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);

          if (task.category_id) {
            const category = taskCategories.find(c => c.category_id === task.category_id);
            if (category) {
              doc.text(`  Category: ${category.name}`, leftMargin + 10, yPos);
              yPos += 4;
            }
          }

          if (task.due_date) {
            const dueText = isOverdue ? `  Due: ${safeDate(task.due_date)} (OVERDUE)` : `  Due: ${safeDate(task.due_date)}`;
            doc.text(dueText, leftMargin + 10, yPos);
            yPos += 4;
          }

          if (task.assignee_id) {
            const assignee = teamMembers.find(m => m.member_id === task.assignee_id);
            if (assignee) {
              doc.text(`  Assigned to: ${assignee.member_name}`, leftMargin + 10, yPos);
              yPos += 4;
            }
          }

          doc.setTextColor(0, 0, 0);
          yPos += 3;
        });

        yPos += 5;
      }
    });
  }

  // Team Assignments
  checkPageBreak(60);
  addSection('Team Assignments');
  if (teamAssignments.length > 0) {
    const assignmentHeaders = ['Team Member', 'Assignment', 'Equipment/Area', 'Time', 'Notes'];
    const assignmentWidths = [40, 35, 35, 35, 35];

    addTableHeader(assignmentHeaders, assignmentWidths);

    teamAssignments.forEach(assignment => {
      const member = teamMembers.find(m => m.member_id === assignment.member_id);
      const memberName = member ? member.member_name : 'Unknown Member';
      const timeRange = safeTimeRange(assignment.start_time, assignment.end_time);

      checkPageBreak(15);
      addTableRow([
        memberName,
        safeText(assignment.assignment_type, '—'),
        safeText(assignment.equipment_area, '—'),
        timeRange,
        safeText(assignment.notes, '—')
      ], assignmentWidths);
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('No team assignments', leftMargin, yPos);
    yPos += 10;
  }

  // Traffic Control
  checkPageBreak(60);
  addSection('Traffic Control');
  if (trafficControls.length > 0) {
    const trafficHeaders = ['Staff Member', 'Patrol Vehicle', 'Area Assignment'];
    const trafficWidths = [60, 60, 60];

    addTableHeader(trafficHeaders, trafficWidths);

    trafficControls.forEach(traffic => {
      const memberName = traffic.staff_name && traffic.staff_name.trim().length
        ? traffic.staff_name.trim()
        : (() => {
            const member = teamMembers.find(m => m.member_id === traffic.member_id);
            return member ? member.member_name : 'Not specified';
          })();

      checkPageBreak(15);
      addTableRow([
        memberName,
        safeText(traffic.patrol_vehicle, '—'),
        safeText(traffic.area_assignment, '—')
      ], trafficWidths);
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('No traffic control assignments', leftMargin, yPos);
    yPos += 10;
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
      leftMargin,
      doc.internal.pageSize.height - 10
    );
  }

  // Generate filename and save
  const eventDate = event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : 'undated';
  const sanitizedName = safeText(event.event_name, 'event').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${sanitizedName}_${eventDate}.pdf`;

  doc.save(filename);
}

export function exportEventSummary(data: PDFExportData): void {
  const { event, teamMembers, teamAssignments = [], trafficControls = [] } = data;

  const doc = new jsPDF();
  let yPos = 20;
  const leftMargin = 20;

  // Summary header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Event Summary', leftMargin, yPos);
  yPos += 15;

  // Basic event info
  doc.setFontSize(12);
  doc.text(event.event_name, leftMargin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryDate = safeDate(event.event_date);
  const summaryLocation = safeText(event.location, 'Location TBD');
  doc.text(`${summaryDate} at ${summaryLocation}`, leftMargin, yPos);
  yPos += 8;
  doc.text(`${event.start_time} - ${event.end_time} (Team meet: ${event.team_meet_time})`, leftMargin, yPos);
  yPos += 15;

  // Quick stats
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Assignment Summary:', leftMargin, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`• Team Assignments: ${teamAssignments.length}`, leftMargin + 10, yPos);
  yPos += 6;
  doc.text(`• Traffic Control: ${trafficControls.length}`, leftMargin + 10, yPos);
  yPos += 6;
  doc.text(`• Total Active Staff: ${teamMembers.filter(m => m.active).length}`, leftMargin + 10, yPos);

  // Save summary
  const eventDate = event.event_date
    ? new Date(event.event_date).toISOString().split('T')[0]
    : 'undated';
  const filename = `${event.event_name.replace(/[^a-zA-Z0-9]/g, '_')}_${eventDate}_summary.pdf`;

  doc.save(filename);
}
