
async function getOrCreateCartId() {
    let cartId = localStorage.getItem('userCartId');

    if (!cartId) {
        try {
            const response = await fetch('/api/carts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await response.json();

            if (data.status === 'success' && data.payload && data.payload._id) {
                cartId = data.payload._id;
                localStorage.setItem('userCartId', cartId);
                console.log('✅ Nuevo carrito creado y guardado en localStorage:', cartId);
            } else {
                console.error('❌ Error al crear un nuevo carrito:', data.message || 'Respuesta inesperada');
                alert('Hubo un problema al inicializar tu carrito. Por favor, recarga la página.');
                return null;
            }
        } catch (error) {
            console.error('❌ Error de red al crear carrito:', error);
            alert('No se pudo conectar con el servidor para crear el carrito. Verifica tu conexión.');
            return null;
        }
    } else {
        console.log('🛒 Carrito existente cargado desde localStorage:', cartId);
    }
    return cartId;
}

// Función para agregar un producto al carrito
async function addProductToCart(productId, quantity) {
    const currentCartId = await getOrCreateCartId();
    if (!currentCartId) return;

    try {
        const response = await fetch(`/api/carts/${currentCartId}/products/${productId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: Number(quantity) })
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            alert('✅ Producto agregado al carrito con éxito!');
        } else {
            alert('❌ Error al agregar el producto al carrito: ' + (data.message || 'Error desconocido'));
            console.error('Error:', data);
        }
    } catch (error) {
        console.error('❌ Error de red al agregar producto:', error);
        alert('Error de conexión al servidor. No se pudo agregar el producto.');
    }
}

// Función para actualizar la cantidad de un producto en el carrito
async function updateProductQuantity(productId, newQuantity) {
    const currentCartId = localStorage.getItem('userCartId');
    if (!currentCartId) {
        alert('No se encontró un carrito. Por favor, recarga la página.');
        return;
    }

    try {
        const response = await fetch(`/api/carts/${currentCartId}/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: Number(newQuantity) })
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            alert('✅ Cantidad de producto actualizada!');
            window.location.reload();
        } else {
            alert('❌ Error al actualizar la cantidad: ' + (data.message || 'Error desconocido'));
            console.error('Error:', data);
        }
    } catch (error) {
        console.error('❌ Error de red al actualizar cantidad:', error);
        alert('Error de conexión al servidor. No se pudo actualizar la cantidad.');
    }
}

// Función para eliminar un producto del carrito
async function removeProductFromCart(productId) {
    const currentCartId = localStorage.getItem('userCartId');
    if (!currentCartId) {
        alert('No se encontró un carrito. Por favor, recarga la página.');
        return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
        return;
    }

    try {
        const response = await fetch(`/api/carts/${currentCartId}/products/${productId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            alert('✅ Producto eliminado del carrito!');
            window.location.reload();
        } else {
            alert('❌ Error al eliminar el producto: ' + (data.message || 'Error desconocido'));
            console.error('Error:', data);
        }
    } catch (error) {
        console.error('❌ Error de red al eliminar producto:', error);
        alert('Error de conexión al servidor. No se pudo eliminar el producto.');
    }
}

// Función para vaciar todo el carrito
async function clearCart() {
    const currentCartId = localStorage.getItem('userCartId');
    if (!currentCartId) {
        alert('No se encontró un carrito para vaciar.');
        return;
    }

    if (!confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
        return;
    }

    try {
        const response = await fetch(`/api/carts/${currentCartId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            alert('✅ Carrito vaciado correctamente!');
            localStorage.removeItem('userCartId');
            window.location.reload();
        } else {
            alert('❌ Error al vaciar el carrito: ' + (data.message || 'Error desconocido'));
            console.error('Error:', data);
        }
    } catch (error) {
        console.error('❌ Error de red al vaciar carrito:', error);
        alert('Error de conexión al servidor. No se pudo vaciar el carrito.');
    }
}

// ✅ Función para finalizar la compra
async function finalizePurchase() {
    const currentCartId = localStorage.getItem('userCartId');
    if (!currentCartId) {
        alert('No se encontró un carrito para finalizar la compra. Por favor, agrega productos primero.');
        return;
    }

    if (!confirm('¿Estás seguro de que quieres finalizar la compra?')) {
        return;
    }

    try {
        const response = await fetch(`/api/carts/${currentCartId}/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
            // No se necesita body para esta API si solo se usa el cartId del URL
        });
        const data = await response.json(); // Intentará parsear la respuesta como JSON

        if (response.ok && data.status === 'success') {
            alert('✅ Compra finalizada con éxito! Tu número de pedido es: ' + data.payload.ticketId);
            localStorage.removeItem('userCartId'); // Vaciar el cartId después de la compra
            window.location.href = `/checkout?orderId=${data.payload.ticketId}`; // Redirigir a la página de checkout
        } else {
            // Si la respuesta no es OK o el status no es 'success'
            alert('❌ Error al finalizar la compra: ' + (data.message || 'Error desconocido'));
            console.error('Error:', data);
            // Si hay productos con stock insuficiente, puedes mostrarlos aquí
            if (data.payload && data.payload.productsFailedStock && data.payload.productsFailedStock.length > 0) {
                console.warn('Productos con stock insuficiente:', data.payload.productsFailedStock);
                alert('Algunos productos no pudieron comprarse por falta de stock. Revisa la consola para más detalles.');
            }
        }
    } catch (error) {
        console.error('❌ Error de red al finalizar la compra:', error);
        alert('Error de conexión al servidor. No se pudo finalizar la compra.');
    }
}


// --- Event Listeners para las vistas ---

document.addEventListener('DOMContentLoaded', async () => {
    // Lógica para la página de productos (index.handlebars)
    if (document.getElementById('filterForm')) {
        const limitInput = document.getElementById('limit');
        if (limitInput && !limitInput.value) {
            limitInput.value = 10;
        }
        await getOrCreateCartId();
        document.querySelectorAll('.add-to-cart-form').forEach(form => {
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const productId = form.dataset.productId;
                const quantity = form.querySelector('input[name="quantity"]').value;
                await addProductToCart(productId, quantity);
            });
        });
    }

    // Lógica para la página de detalle de producto (productDetail.handlebars)
    if (document.querySelector('.add-to-cart-form[data-product-id]')) {
        const form = document.querySelector('.add-to-cart-form');
        const productId = form.dataset.productId;
        const stock = Number(form.querySelector('input[name="quantity"]').max);

        const qtyInput = document.getElementById('qty');
        const addButton = form.querySelector('button[type="submit"]');

        if (stock <= 0) {
            if (qtyInput) {
                qtyInput.value = 0;
                qtyInput.disabled = true;
            }
            if (addButton) {
                addButton.disabled = true;
                addButton.textContent = 'Sin Stock';
            }
        } else {
            if (qtyInput) qtyInput.max = stock;
        }

        await getOrCreateCartId();

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const quantity = Number(qtyInput.value);

            if (quantity <= 0 || quantity > stock) {
                alert(`Por favor, ingresa una cantidad válida entre 1 y ${stock}.`);
                return;
            }
            await addProductToCart(productId, quantity);
        });
    }

    // Lógica para la página de detalle del carrito (cartDetail.handlebars)
    if (document.querySelector('.cart-container')) {
        document.querySelectorAll('.update-quantity-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const productId = button.dataset.productId;
                const quantityInput = document.getElementById(`qty-${productId}`);
                const newQuantity = quantityInput.value;
                await updateProductQuantity(productId, newQuantity);
            });
        });

        document.querySelectorAll('.remove-product-btn').forEach(button => {
            button.addEventListener('click', async () => {
                const productId = button.dataset.productId;
                await removeProductFromCart(productId);
            });
        });

        const clearCartBtn = document.getElementById('clear-cart-btn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', clearCart);
        }

        // ✅ Event listener para el botón Finalizar Compra
        const finalizePurchaseBtn = document.getElementById('finalize-purchase-btn');
        if (finalizePurchaseBtn) {
            finalizePurchaseBtn.addEventListener('click', finalizePurchase);
        }
    }
});