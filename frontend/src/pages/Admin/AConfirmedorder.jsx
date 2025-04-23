import React, { useEffect, useState, useRef } from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import { Eye } from 'lucide-react';
import { FaPrint } from 'react-icons/fa';
import axios from 'axios';
import './AConfirmedorder.css';

// Reusable Components
const Input = ({ type, placeholder, className, onChange }) => (
    <input type={type} placeholder={placeholder} className={`custom-input ${className}`} onChange={onChange} />
);
const Button = ({ children, className, onClick }) => (
    <button className={`custom-button ${className}`} onClick={onClick}>
        {children}
    </button>
);
const Table = ({ children }) => <table className="custom-table">{children}</table>;
const TableHead = ({ children }) => <thead className="table-head">{children}</thead>;
const TableRow = ({ children }) => <tr className="table-row">{children}</tr>;
const TableHeader = ({ children }) => <th className="table-header">{children}</th>;
const TableBody = ({ children }) => <tbody className="table-body">{children}</tbody>;
const TableCell = ({ children }) => <td className="table-cell">{children}</td>;

const AConfirmedorder = () => {
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState('');
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
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <p><strong>RAM Medical</strong></p>
                <br/>
                ${printContents}
                <p><strong>......................</strong></p>
                <p><strong>Checked by</strong></p>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const filteredOrders = orders.filter(order =>
        order.RepName.toLowerCase().includes(search.toLowerCase()) ||
        order.PharmacyName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="admin-layout">
            <ASidebar />
            <div className="content">
                <ANavbar />
                <div className="page-content">
                    <h1 className="page-title">Confirmed Orders</h1>

                    <div className="search-filters">
                        <Input
                            type="text"
                            placeholder="Search by Rep Name or Pharmacy Name"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="table-container">
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
                                            <Button onClick={() => handleViewOrder(order.OrderID)}>
                                                <Eye size={20} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {showPopup && selectedOrder && (
                        <div className="popup-overlay show">
                            <div className="popup-content large-popup">
                                <div className="popup-header">
                                    <h2>Order Details</h2>
                                    <button className="print-button" onClick={handlePrint}>
                                        <FaPrint /> Print
                                    </button>
                                </div>

                                <div ref={printRef}>
                                    <div className="order-summary">
                                        <p><strong>Order ID:</strong> {selectedOrder.info.OrderID}</p>
                                        <p><strong>Pharmacy Name:</strong> {selectedOrder.info.PharmacyName}</p>
                                        <p><strong>Rep Name:</strong> {selectedOrder.info.RepName}</p>
                                        <p><strong>Order Date:</strong> {formatDate(selectedOrder.info.OrderDate)}</p>
                                        <p><strong>Confirmed Date:</strong> {formatDate(selectedOrder.info.ConfirmedDate)}</p>
                                    </div>

                                    <table className="order-details-table">
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
                                </div>

                                <button className="close-popup" onClick={() => setShowPopup(false)}>Close</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AConfirmedorder;
