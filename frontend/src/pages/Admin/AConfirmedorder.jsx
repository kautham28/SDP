import React, { useEffect, useState } from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import { Eye } from 'lucide-react';
import axios from 'axios';
import './AConfirmedorder.css';

// Custom Components
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

    useEffect(() => {
        axios.get('http://localhost:5000/api/confirmed-orders')
            .then(response => {
                setOrders(response.data);
            })
            .catch(error => {
                console.error("There was an error fetching the orders!", error);
            });
    }, []);

    const formatDate = (date) => {
        const d = new Date(date);
        return d.toLocaleDateString();
    };

    const handleViewOrder = async (orderId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/orders/details/${orderId}`);
            setSelectedOrder(response.data);
            setShowPopup(true);
        } catch (error) {
            console.error('Error fetching order details:', error);
        }
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

                    {/* Search Filter */}
                    <div className="search-filters">
                        <Input type="text" placeholder="Search by Rep Name or Pharmacy Name" className="search-input" onChange={(e) => setSearch(e.target.value)} />
                    </div>

                    {/* Orders Table */}
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
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.OrderID}>
                                        <TableCell>{order.OrderID}</TableCell>
                                        <TableCell>{order.PharmacyName}</TableCell>
                                        <TableCell>{order.RepName}</TableCell>
                                        <TableCell>{order.TotalValue.toFixed(2)}</TableCell>
                                        <TableCell>{formatDate(order.OrderDate)}</TableCell>
                                        <TableCell>{formatDate(order.ConfirmedDate)}</TableCell>
                                        <TableCell>
                                            <Button className="action-button" onClick={() => handleViewOrder(order.OrderID)}>
                                                <Eye size={20} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Popup for Order Details */}
                    {showPopup && selectedOrder && (
                        <div className="popup-overlay show">
                            <div className="popup-content large-popup">
                                <h2>Order Details</h2>
                                <p><strong>Order ID:</strong> {selectedOrder[0]?.orderId}</p>
                                <table className="order-details-table">
                                    <thead>
                                        <tr>
                                            <th>Detail ID</th>
                                            <th>Product Name</th>
                                            <th>Unit Price</th>
                                            <th>Quantity</th>
                                            <th>Total Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.map(detail => (
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
