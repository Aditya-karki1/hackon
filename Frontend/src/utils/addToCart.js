export const addToCart = async (productId, quantity) => {
  const token = localStorage.getItem("token");
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  if (!token) {
    window.location.href = "/signin";
    return { ok: false, error: "Please sign in first." };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, quantity }),
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/signin";
      return { ok: false, error: "Session expired. Please sign in again." };
    }

    const data = await response.json();
    if (!response.ok) return { ok: false, error: data.error || "Failed to add to cart" };
    window.dispatchEvent(new Event("cartUpdated"));
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: "Network error. Please try again." };
  }
};
