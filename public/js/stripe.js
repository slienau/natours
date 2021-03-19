/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

const stripe = Stripe(
  "pk_test_51IWNzeKjpOPauezxAC6kVjLMjUO3uC3qaxf5ZgkthJ01hujn1ORL950RWBSLnnuvlZMqBgw1r8XPqsgW97WXJnHe00V4nKpZaH"
);

export const bookTour = async tourId => {
  try {
    // get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // create checkout form + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (e) {
    console.error(e);
    showAlert("error", e);
  }
};
