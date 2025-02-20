import React from 'react';
import ASidebar from '../../components/Admin/ASidebar';
import ANavbar from '../../components/Admin/ANavbar';
import { Eye } from 'lucide-react';
import './AConfirmedorder.css';

// Custom Input Component
const Input = ({ type, placeholder, className }) => {
    return <input type={type} placeholder={placeholder} className={`custom-input ${className}`} />;
};

// Custom Button Component
const Button = ({ children, className, onClick }) => {
    return (
        <button className={`custom-button ${className}`} onClick={onClick}>
            {children}
        </button>
    );
};

// Custom Table Components
const Table = ({ children }) => <table className="custom-table">{children}</table>;
const TableHead = ({ children }) => <thead className="table-head">{children}</thead>;
const TableRow = ({ children }) => <tr className="table-row">{children}</tr>;
const TableHeader = ({ children }) => <th className="table-header">{children}</th>;
const TableBody = ({ children }) => <tbody className="table-body">{children}</tbody>;
const TableCell = ({ children }) => <td className="table-cell">{children}</td>;

const AConfirmedorder = () => {
    // Sample data
    const sampleOrders = [
        { id: 101, pharmacy: "MediCare Pharmacy", rep: "John Doe", total: "$450.00", date: "2025-02-18" },
        { id: 102, pharmacy: "Health Plus", rep: "Jane Smith", total: "$320.00", date: "2025-02-17" },
        { id: 103, pharmacy: "LifeLine Pharma", rep: "Robert Brown", total: "$580.00", date: "2025-02-16" },
    ];

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <ASidebar />

            <div className="content">
                {/* Navbar */}
                <ANavbar />

                {/* Page Content */}
                <div className="page-content">
                    <h1 className="page-title">Confirmed Orders</h1>

                    {/* Search Filters */}
                    <div className="search-filters">
                        <Input type="text" placeholder="Search by Rep Name" className="search-input" />
                        <Input type="text" placeholder="Search by Pharmacy Name" className="search-input" />
                        <Input type="date" className="search-input" />
                        <Button className="search-button">Search</Button>
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
                                    <TableHeader>Confirm Date</TableHeader>
                                    <TableHeader>Actions</TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sampleOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>{order.id}</TableCell>
                                        <TableCell>{order.pharmacy}</TableCell>
                                        <TableCell>{order.rep}</TableCell>
                                        <TableCell>{order.total}</TableCell>
                                        <TableCell>{order.date}</TableCell>
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
