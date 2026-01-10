import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  bookings: [],
  currentBooking: null,
  loading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings: (state, action) => {
      state.bookings = action.payload;
      state.loading = false;
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
    addBooking: (state, action) => {
      state.bookings.unshift(action.payload);
    },
    updateBooking: (state, action) => {
      const index = state.bookings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = { ...state.bookings[index], ...action.payload };
      }
      if (state.currentBooking?.id === action.payload.id) {
        state.currentBooking = { ...state.currentBooking, ...action.payload };
      }
    },
    removeBooking: (state, action) => {
      state.bookings = state.bookings.filter(b => b.id !== action.payload);
      if (state.currentBooking?.id === action.payload) {
        state.currentBooking = null;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setBookings,
  setCurrentBooking,
  addBooking,
  updateBooking,
  removeBooking,
  setLoading,
  setError,
  clearError,
} = bookingSlice.actions;

export default bookingSlice.reducer;
