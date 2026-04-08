export interface StatItem {
  label: string;
  value: string;
  delta: string;
  icon: string;
  iconClass: string;
}

export interface Appointment {
  time: string;
  pet: string;
  tutor: string;
  procedure: string;
  status: string;
  statusClass: string;
}

export interface VaccineAlert {
  pet: string;
  detail: string;
  urgency: string;
  urgencyClass: string;
}
