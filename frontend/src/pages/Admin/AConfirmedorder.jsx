import React, { useEffect, useState, useRef } from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import { Eye } from 'lucide-react';
import { FaPrint } from 'react-icons/fa';
import axios from 'axios';
import './AConfirmedorder.css';

// Reusable Components
const Input = ({ type, placeholder, className, onChange }) => (
    <input type={type} placeholder={placeholder} className={`aco-custom-input ${className}`} onChange={onChange} />
);
const Button = ({ children, className, onClick }) => (
    <button className={`aco-custom-button ${className}`} onClick={onClick}>
        {children}
    </button>
);
const Table = ({ children }) => <table className="aco-orders-table">{children}</table>;
const TableHead = ({ children }) => <thead className="aco-table-head">{children}</thead>;
const TableRow = ({ children }) => <tr className="aco-table-row">{children}</tr>;
const TableHeader = ({ children }) => <th className="aco-table-header">{children}</th>;
const TableBody = ({ children }) => <tbody className="aco-table-body">{children}</tbody>;
const TableCell = ({ children }) => <td className="aco-table-cell">{children}</td>;

const AConfirmedorder = () => {
    const [orders, setOrders] = useState([]);
    const [pharmacySearch, setPharmacySearch] = useState('');
    const [repSearch, setRepSearch] = useState('');
    const [orderDateSearch, setOrderDateSearch] = useState('');
    const [confirmedDateSearch, setConfirmedDateSearch] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const printRef = useRef();

    useEffect(() => {
        axios.get('http://localhost:5000/api/confirmed-orders')
            .then(response => setOrders(response.data))
            .catch(error => console.error("Error fetching orders:", error));
    }, []);

    const formatDate = (date) => new Date(date).toLocaleDateString();

    const handleViewOrder = async (orderId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/orders/details/${orderId}`);
            const orderDetails = response.data;
            const orderInfo = orders.find(o => o.OrderID === orderId);
            setSelectedOrder({ info: orderInfo, details: orderDetails });
            setShowPopup(true);
        } catch (error) {
            console.error('Error fetching order details:', error);
        }
    };

    const handlePrint = () => {
        const printContents = printRef.current.innerHTML;
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h2 { color: #003f4f; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <p><strong>RAM Medical</strong></p>
                <br/>
                ${printContents}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const filteredOrders = orders.filter(order =>
        order.PharmacyName.toLowerCase().includes(pharmacySearch.toLowerCase()) &&
        order.RepName.toLowerCase().includes(repSearch.toLowerCase()) &&
        order.OrderDate.includes(orderDateSearch) &&
        order.ConfirmedDate.includes(confirmedDateSearch)
    );

    return (
        <div className="aco-admin-layout">
            <ASidebar />
            <div className="aco-content">
                <ANavbar />
                <div className="aco-page-content">
                    <h1 className="aco-page-title">Confirmed Orders</h1>

                    <div className="aco-search-bar">
                        <Input
                            type="text"
                            placeholder="Search by Pharmacy Name"
                            onChange={(e) => setPharmacySearch(e.target.value)}
                        />
                        <Input
                            type="text"
                            placeholder="Search by Rep Name"
                            onChange={(e) => setRepSearch(e.target.value)}
                        />
                        <Input
                            type="text"
                            placeholder="Search by Order Date (YYYY-MM-DD)"
                            onChange={(e) => setOrderDateSearch(e.target.value)}
                        />
                        <Input
                            type="text"
                            placeholder="Search by Confirmed Date (YYYY-MM-DD)"
                            onChange={(e) => setConfirmedDateSearch(e.target.value)}
                        />
                    </div>

                    <div className="aco-table-container">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>Order ID</TableHeader>
                                    <TableHeader>Pharmacy Name</TableHeader>
                                    <TableHeader>Rep Name</TableHeader>
                                    <TableHeader>Total Value</TableHeader>
                                    <TableHeader>Order Date</TableHeader>
                                    <TableHeader>Confirmed Date</TableHeader>
                                    <TableHeader>Actions</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredOrders.map(order => (
                                    <TableRow key={order.OrderID}>
                                        <TableCell>{order.OrderID}</TableCell>
                                        <TableCell>{order.PharmacyName}</TableCell>
                                        <TableCell>{order.RepName}</TableCell>
                                        <TableCell>{order.TotalValue.toFixed(2)}</TableCell>
                                        <TableCell>{formatDate(order.OrderDate)}</TableCell>
                                        <TableCell>{formatDate(order.ConfirmedDate)}</TableCell>
                                        <TableCell>
                                            <div className="aco-action-buttons">
                                                <Button className="aco-view-button" onClick={() => handleViewOrder(order.OrderID)}>
                                                    <Eye />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {showPopup && selectedOrder && (
                        <div className="aco-popup-overlay">
                            <div className="aco-popup-content">
                                <div className="aco-popup-header">
                                    <h2>Order Details</h2>
                                    <Button className="aco-print-button" onClick={handlePrint}>
                                        <FaPrint /> Print
                                    </Button>
                                </div>

                                <div ref={printRef}>
                                    <div className="aco-order-summary">
                                        <p><strong>Order ID:</strong> {selectedOrder.info.OrderID}</p>
                                        <p><strong>Pharmacy Name:</strong> {selectedOrder.info.PharmacyName}</p>
                                        <p><strong>Rep Name:</strong> {selectedOrder.info.RepName}</p>
                                        <p><strong>Order Date:</strong> {formatDate(selectedOrder.info.OrderDate)}</p>
                                        <p><strong>Confirmed Date:</strong> {formatDate(selectedOrder.info.ConfirmedDate)}</p>
                                    </div>

                                    <table className="aco-order-details-table">
                                        <thead>
                                            <tr>
                                                <th>Detail ID</th>
                                                <th>Product Name</th>
                                                <th>Unit Price</th>
                                                <th>Quantity</th>
                                                <th>Item Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.details.map(detail => (
                                                <tr key={detail.detailId}>
                                                    <td>{detail.detailId}</td>
                                                    <td>{detail.product_name}</td>
                                                    <td>{detail.unit_price}</td>
                                                    <td>{detail.quantity}</td>
                                                    <td>{detail.total_price}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <br /><br />
                                    <p><strong>Total Value:</strong> {selectedOrder.info.TotalValue.toFixed(2)}</p>
                                    <p><strong>Discount (%):</strong> {selectedOrder.info.Discount ? selectedOrder.info.Discount + '%' : '0%'}</p>
                                    <p><strong>Discount Value:</strong> {selectedOrder.info.DiscountValue ? Number(selectedOrder.info.DiscountValue).toFixed(2) : '0.00'}</p>
                                    <p><strong>Final Price:</strong> {(selectedOrder.info.TotalValue - (selectedOrder.info.DiscountValue || 0)).toFixed(2)}</p>
                                </div>

                                <Button className="aco-close-popup" onClick={() => setShowPopup(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AConfirmedorder;