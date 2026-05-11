import { HOUSES, DEFAULT_BRAND } from './constants.js';

export function reducer(state, action) {
  switch (action.type) {
    case "LOAD":
      return {
        ...state,
        ...action.state,
        houses: HOUSES.map(h => ({ ...h, customName: h.name+" ("+h.colorLabel+")" })),
        brand: { ...DEFAULT_BRAND, ...(action.state.brand || {}) },
      };
    case "UPDATE_BRAND":
      return { ...state, brand: { ...state.brand, ...action.brand } };
    case "ADD_STUDENT":
      return { ...state, students: [...state.students, action.s] };
    case "ADD_STUDENTS_BULK":
      return { ...state, students: [...state.students, ...action.list] };
    case "DELETE_STUDENT":
      return {
        ...state,
        students: state.students.filter(s => s.id !== action.id),
        logs:     state.logs.filter(l => l.studentId !== action.id),
      };
    case "ADD_STAFF":
      return { ...state, staff: [...state.staff, action.s] };
    case "DELETE_STAFF":
      return { ...state, staff: state.staff.filter(s => s.id !== action.id) };
    case "ADD_LOG":
      return {
        ...state,
        logs:          [...state.logs, action.log],
        notifications: [...state.notifications, ...action.notifs],
      };
    case "MARK_READ":
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.id
            ? { ...n, readBy: [...new Set([...n.readBy, action.uid])] }
            : n
        ),
      };
    case "SUBMIT_APPEAL":
      return {
        ...state,
        appeals: [...state.appeals, action.appeal],
        logs:    state.logs.map(l => l.id === action.logId ? { ...l, status: "appealing" } : l),
      };
    case "RESOLVE_APPEAL": {
      const ap = state.appeals.find(x => x.id === action.id);
      const accepted = action.resolution === "accepted";
      return {
        ...state,
        appeals: state.appeals.map(x =>
          x.id === action.id
            ? { ...x, status: action.resolution, resolvedBy: action.by, resolvedNote: action.note, resolvedAt: Date.now() }
            : x
        ),
        logs: state.logs.map(l =>
          l.id === ap?.logId ? { ...l, status: accepted ? "overturned" : "active" } : l
        ),
      };
    }
    case "UPDATE_PARENT_NOTE":
      return {
        ...state,
        appeals: state.appeals.map(a =>
          a.id === action.id ? { ...a, parentNote: action.note } : a
        ),
      };
    default:
      return state;
  }
}
