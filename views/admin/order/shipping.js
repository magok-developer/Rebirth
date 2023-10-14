const shipptingListEl = document.getElementById('shipping-list');
const checkAll = document.getElementById('check-all');
const totalEl = document.getElementById('total');
const changeStatusBtn = document.getElementById('change-status');

let orderId;

// 날짜 시간 설정
function formatDate(createdAt) {
    const orderDate = createdAt.split('.')[0];
    const date = orderDate.split('T')[0];
    const time = orderDate.split('T')[1];

    return `${date} ${time}`;
}

// 전체 선택 체크박스 설정
function selectAllCheckboxes() {
    const checkBoxElList = Array.from(document.querySelectorAll('#check-item'));

    if (checkAll.checked) {
        checkBoxElList.forEach(el => {
            const element = el;
            element.checked = true;
        });
    } else {
        checkBoxElList.forEach(el => {
            const element = el;
            element.checked = false;
        });
    }
}

// 주문 목록 생성
function setOrderList(date, id, addressee, orderItems, totalPrice) {
    let totalQuantity = 0;
    const productList = orderItems.map(({ option, quantity, item }) => {
        const productName = `${item.name} [${option.color} / ${option.size}]`;
        totalQuantity += quantity;
        return [productName, quantity];
    });
    const itemText = productList.length <= 1 ? `${productList[0][0]}` : `${productList[0][0]} 외 ${productList.length - 1}개`;

    const element = `<tr id="order-${orderId}">
    <td><input class="form-check-input" type="checkbox" id="check-item"></td>
              <td id="shipping-date">${date.replace(' ', '<br>')}</td>
              <td id="shipping-id">${id}</td>
              <td id="shipping-username">${addressee}</td>
              <td id="shipping-product">${itemText}</td>
              <td id="shipping-vertify">${totalQuantity}</td>
              <td id="shipping-price">${totalPrice}</td>
            </tr>`

    shipptingListEl.insertAdjacentHTML('beforeend', element);
    orderId += 1;
}

// 배송상태별 주문 목록 요청
async function insertOrderList() {
    // const url = './orderlistdata.json';    // 임시 데이터
    const url = '/api/v1/orders/shipping/1/20';

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                status: "배송중"
            })
        });
        // const res = await fetch(url);
        const data = await res.json();

        orderId = 0;
        const { orders } = data;
        orders.forEach(order => {
            const { createdAt, address, orderItems, totalPrice, _id: id } = order;
            const { addressee } = address;
            const date = formatDate(createdAt);

            setOrderList(date, id, addressee, orderItems, totalPrice);
        });

        totalEl.innerText = `[총 ${orders.length}개]`;

    } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
        // eslint-disable-next-line no-alert
        alert('주문 조회 중 오류 발생 : ', err);
    }
}

// 주문의 배송상태를 배송완료로 변경 요청
async function changeStatus(idList) {
    const url = `/api/v1/orders/update/status`;

    try {
        const res = await fetch(url, {
            method: "PATCH",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderIds: idList,
                status: "배송완료",
            })
        });

        if (res.ok) {
            insertOrderList();
            // eslint-disable-next-line no-alert
            alert('선택하신 주문의 배송상태가 변경되었습니다.');
            
        }
    } catch (err) {
        // eslint-disable-next-line no-alert
        alert('배송상태 변경이 실패되었습니다.');
    }
}

// 선택한 주문만 배송상태 변경
function orderDelivered() {
    const checkList = document.querySelectorAll("#check-item");

    const checkedOrders = [...checkList].map((order, idx) => {
        if (order.checked === true) {
            return document.querySelector(`#order-${idx} #shipping-id`).textContent;
        }
        return null;
    }).filter(order => order);

    if (checkedOrders.length === 0) {
        // eslint-disable-next-line no-alert
        alert('배송을 완료할 주문을 선택해 주세요.');
        return;
    }

    // eslint-disable-next-line no-alert
    if (window.confirm('선택한 주문의 배송상태를 "배송완료"로 변경하시겠습니까?')) {
        while (shipptingListEl.firstChild) {
            shipptingListEl.removeChild(shipptingListEl.firstChild);
        }
        checkAll.checked = false;
        changeStatus(checkedOrders);
    }
}

insertOrderList();
changeStatusBtn.addEventListener('click', orderDelivered);
checkAll.addEventListener('click', selectAllCheckboxes);