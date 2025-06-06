'use client'
import React, { useState, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  Divider,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  AccountBalanceWallet,
  ContentCopy,
  Preview
} from '@mui/icons-material';

const InvoiceGenerator = () => {
  const fileInputRef = useRef(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Company Details State
  const [companyDetails, setCompanyDetails] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    logo: null
  });

  // Client Details State
  const [clientDetails, setClientDetails] = useState({
    name: '',
    email: '',
    address: '',
    phone: ''
  });

  // Invoice Details State
  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    currency: 'USD'
  });

  // Service Items State
  const [serviceItems, setServiceItems] = useState([
    { id: 1, description: '', quantity: 1, rate: 0, amount: 0 }
  ]);

  // Payment Details State
  const [paymentDetails, setPaymentDetails] = useState({
    acceptCrypto: false,
    supportedChains: [],
    walletAddresses: {},
    bankDetails: {
      accountName: '',
      accountNumber: '',
      routingNumber: '',
      bankName: ''
    },
    paypalEmail: '',
    notes: ''
  });

  const cryptoChains = [
    { name: 'Bitcoin', symbol: 'BTC', color: '#f7931a' },
    { name: 'Ethereum', symbol: 'ETH', color: '#627eea' },
    { name: 'Binance Smart Chain', symbol: 'BSC', color: '#f3ba2f' },
    { name: 'Polygon', symbol: 'MATIC', color: '#8247e5' },
    { name: 'Solana', symbol: 'SOL', color: '#00d4aa' },
    { name: 'Cardano', symbol: 'ADA', color: '#0033ad' }
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BTC', 'ETH'];

  // Calculations
  const subtotal = serviceItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  // Handlers
  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyDetails(prev => ({ ...prev, logo: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addServiceItem = () => {
    const newId = Math.max(...serviceItems.map(item => item.id)) + 1;
    setServiceItems(prev => [...prev, {
      id: newId,
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }]);
  };

  const updateServiceItem = (id, field, value) => {
    setServiceItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeServiceItem = (id) => {
    if (serviceItems.length > 1) {
      setServiceItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleChainToggle = (chain) => {
    const isSelected = paymentDetails.supportedChains.includes(chain.symbol);
    if (isSelected) {
      setPaymentDetails(prev => ({
        ...prev,
        supportedChains: prev.supportedChains.filter(c => c !== chain.symbol),
        walletAddresses: { ...prev.walletAddresses, [chain.symbol]: undefined }
      }));
    } else {
      setPaymentDetails(prev => ({
        ...prev,
        supportedChains: [...prev.supportedChains, chain.symbol]
      }));
    }
  };

  const generateInvoice = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const copyWalletAddress = (address) => {
    navigator.clipboard.writeText(address);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            Invoice Generator
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Preview />}
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? 'Edit Mode' : 'Preview'}
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={generateInvoice}
              sx={{ bgcolor: '#9c27b0' }}
            >
              Generate Invoice
            </Button>
          </Box>
        </Box>

        {showSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Invoice generated successfully! Ready for download.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Panel - Form */}
          <Grid item xs={12} lg={8}>
            {/* Company Details */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                  Company Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      {companyDetails.logo ? (
                        <Avatar
                          src={companyDetails.logo}
                          sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}
                        />
                      ) : (
                        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 1, bgcolor: '#9c27b0' }}>
                          <CloudUploadIcon />
                        </Avatar>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => fileInputRef.current.click()}
                      >
                        Upload Logo
                      </Button>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      value={companyDetails.name}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, name: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={companyDetails.email}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      multiline
                      rows={2}
                      value={companyDetails.address}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, address: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={companyDetails.phone}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Website"
                      value={companyDetails.website}
                      onChange={(e) => setCompanyDetails(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Client Details */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                  Client Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Client Name"
                      value={clientDetails.name}
                      onChange={(e) => setClientDetails(prev => ({ ...prev, name: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Client Email"
                      type="email"
                      value={clientDetails.email}
                      onChange={(e) => setClientDetails(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Client Address"
                      multiline
                      rows={2}
                      value={clientDetails.address}
                      onChange={(e) => setClientDetails(prev => ({ ...prev, address: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Client Phone"
                      value={clientDetails.phone}
                      onChange={(e) => setClientDetails(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                  Invoice Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Invoice Number"
                      value={invoiceDetails.invoiceNumber}
                      onChange={(e) => setInvoiceDetails(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      value={invoiceDetails.date}
                      onChange={(e) => setInvoiceDetails(prev => ({ ...prev, date: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Due Date"
                      type="date"
                      value={invoiceDetails.dueDate}
                      onChange={(e) => setInvoiceDetails(prev => ({ ...prev, dueDate: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={invoiceDetails.currency}
                        onChange={(e) => setInvoiceDetails(prev => ({ ...prev, currency: e.target.value }))}
                      >
                        {currencies.map(currency => (
                          <MenuItem key={currency} value={currency}>{currency}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Service Items */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                    Services
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addServiceItem}
                    size="small"
                  >
                    Add Item
                  </Button>
                </Box>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="center">Rate</TableCell>
                        <TableCell align="center">Amount</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {serviceItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={item.description}
                              onChange={(e) => updateServiceItem(item.id, 'description', e.target.value)}
                              placeholder="Service description"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateServiceItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateServiceItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            ${item.amount.toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => removeServiceItem(item.id)}
                              disabled={serviceItems.length === 1}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                  Payment Details
                </Typography>

                {/* Crypto Payment Toggle */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={paymentDetails.acceptCrypto}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, acceptCrypto: e.target.checked }))}
                    />
                  }
                  label="Accept Cryptocurrency Payments"
                  sx={{ mb: 2 }}
                />

                {/* Supported Blockchains */}
                {paymentDetails.acceptCrypto && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Supported Blockchains
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {cryptoChains.map((chain) => (
                        <Chip
                          key={chain.symbol}
                          label={`${chain.name} (${chain.symbol})`}
                          onClick={() => handleChainToggle(chain)}
                          color={paymentDetails.supportedChains.includes(chain.symbol) ? 'primary' : 'default'}
                          sx={{
                            bgcolor: paymentDetails.supportedChains.includes(chain.symbol) ? chain.color : undefined,
                            color: paymentDetails.supportedChains.includes(chain.symbol) ? 'white' : undefined
                          }}
                        />
                      ))}
                    </Box>

                    {/* Wallet Addresses */}
                    {paymentDetails.supportedChains.map((chainSymbol) => (
                      <Box key={chainSymbol} sx={{ mb: 2 }}>
                        <TextField
                          fullWidth
                          label={`${chainSymbol} Wallet Address`}
                          value={paymentDetails.walletAddresses[chainSymbol] || ''}
                          onChange={(e) => setPaymentDetails(prev => ({
                            ...prev,
                            walletAddresses: { ...prev.walletAddresses, [chainSymbol]: e.target.value }
                          }))}
                          InputProps={{
                            endAdornment: paymentDetails.walletAddresses[chainSymbol] && (
                              <IconButton
                                size="small"
                                onClick={() => copyWalletAddress(paymentDetails.walletAddresses[chainSymbol])}
                              >
                                <ContentCopy />
                              </IconButton>
                            )
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Traditional Payment Methods */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Traditional Payment Methods
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="PayPal Email"
                      value={paymentDetails.paypalEmail}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, paypalEmail: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Bank Account Name"
                      value={paymentDetails.bankDetails.accountName}
                      onChange={(e) => setPaymentDetails(prev => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, accountName: e.target.value }
                      }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Account Number"
                      value={paymentDetails.bankDetails.accountNumber}
                      onChange={(e) => setPaymentDetails(prev => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                      }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Bank Name"
                      value={paymentDetails.bankDetails.bankName}
                      onChange={(e) => setPaymentDetails(prev => ({
                        ...prev,
                        bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                      }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Payment Notes"
                      multiline
                      rows={3}
                      value={paymentDetails.notes}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional payment instructions or notes..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Panel - Invoice Preview */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#9c27b0', fontWeight: 'bold' }}>
                  Invoice Preview
                </Typography>
                
                {/* Invoice Header */}
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  {companyDetails.logo && (
                    <img src={companyDetails.logo} alt="Logo" style={{ width: 60, height: 60, marginBottom: 8 }} />
                  )}
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                    INVOICE
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {invoiceDetails.invoiceNumber}
                  </Typography>
                </Box>

                {/* Company Info */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    From:
                  </Typography>
                  <Typography variant="body2">{companyDetails.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {companyDetails.address}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {companyDetails.email}
                  </Typography>
                </Box>

                {/* Client Info */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    To:
                  </Typography>
                  <Typography variant="body2">{clientDetails.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {clientDetails.email}
                  </Typography>
                </Box>

                {/* Invoice Details */}
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Date:</Typography>
                      <Typography variant="body2">{invoiceDetails.date}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Due Date:</Typography>
                      <Typography variant="body2">{invoiceDetails.dueDate}</Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Services */}
                <Box sx={{ mb: 2 }}>
                  {serviceItems.map((item, index) => (
                    <Box key={item.id} sx={{ mb: 1 }}>
                      <Typography variant="body2">{item.description}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.quantity} × ${item.rate} = ${item.amount.toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Totals */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">{invoiceDetails.currency} {subtotal.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tax (10%):</Typography>
                    <Typography variant="body2">{invoiceDetails.currency} {tax.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9c27b0' }}>
                      {invoiceDetails.currency} {total.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                {/* Payment Methods Preview */}
                {(paymentDetails.acceptCrypto || paymentDetails.paypalEmail) && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Payment Methods:
                    </Typography>
                    {paymentDetails.acceptCrypto && paymentDetails.supportedChains.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Crypto: {paymentDetails.supportedChains.join(', ')}
                        </Typography>
                      </Box>
                    )}
                    {paymentDetails.paypalEmail && (
                      <Typography variant="body2" color="textSecondary">
                        PayPal: {paymentDetails.paypalEmail}
                      </Typography>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default InvoiceGenerator;