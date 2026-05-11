import { HOUSES, DEFAULT_BRAND } from './constants.js';

function applyBrandHouses(brandHouses, fallback) {
  return HOUSES.map(h => {
    const ov = brandHouses?.find(bh => bh.id === h.id);
    return ov ? { ...h, ...ov } : (fallback?.find(fh => fh.id === h.id) || { ...h, customName: h.name + " (" + h.colorLabel + ")" });
  });
}

export function reducer(state, action) {
  switch (action.type) {
    case "LOAD": {
      const brand = { ...DEFAULT_BRAND, ...(action.state.brand || {}) };
      const houses = applyBrandHouses(brand.houses, null);
      return { ...state, ...action.state, brand, houses, customMatrix: action.state.customMatrix ?? null };
    }
    case "UPDATE_BRAND": {
      const newBrand = { ...state.brand, ...action.brand };
      const houses = newBrand.houses ? applyBrandHouses(newBrand.houses, state.houses) : state.houses;
      return { ...state, brand: newBrand, houses };
    }
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
    case "ADD_STAFF_BULK":
      return { ...state, staff: [...state.staff, ...action.list] };
    case "UPDATE_STAFF":
      return { ...state, staff: state.staff.map(s => s.id === action.id ? { ...s, ...action.data } : s) };
    case "UPDATE_MATRIX":
      return { ...state, customMatrix: action.matrix };
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
