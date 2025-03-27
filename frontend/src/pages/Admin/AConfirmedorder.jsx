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

    useEffect(() => {
        // Fetch confirmed orders from backend
        axios.get('http://localhost:5000/api/confirmed-orders')
            .then(response => {
                setOrders(response.data);
            })
            .catch(error => {
                console.error("There was an error fetching the orders!", error);
            });
    }, []);

    // Format date function
    const formatDate = (date) => {
        const d = new Date(date);
        return d.toLocaleDateString(); // Will return date in MM/DD/YYYY format
    };

    // Filtered orders based on search input
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

                    {/* Search Filters */}
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
                                            <Button className="action-button">
                                                <Eye size={20} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AConfirmedorder;
