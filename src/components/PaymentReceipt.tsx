import React from 'react';
import { jsPDF } from 'jspdf';

interface PaymentReceiptProps {
  date: string;
  amount: number;
  receivedFrom: string;
  paymentMode: string;
  placeOfSupply: string;
  customerAddress: string;
}

export async function generatePaymentReceiptPDF({ date, amount, receivedFrom, paymentMode, placeOfSupply, customerAddress }: PaymentReceiptProps) {
  // Helper function to convert number to words
  const convertToWords = (num: number): string => {
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const formatTens = (num: number): string => {
      if (num < 10) return single[num];
      if (num < 20) return double[num - 10];
      return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + single[num % 10] : '');
    };
    
    if (num === 0) return 'Zero';
    
    let words = '';
    
    if (num >= 10000000) {
      words += convertToWords(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }
    
    if (num >= 100000) {
      words += convertToWords(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }
    
    if (num >= 1000) {
      words += convertToWords(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }
    
    if (num >= 100) {
      words += convertToWords(Math.floor(num / 100)) + ' Hundred ';
      num %= 100;
    }
    
    if (num > 0) {
      words += formatTens(num);
    }
    
    return words.trim();
  };

  try {
    // Load images first
    const [logoImg, signatureImg] = await Promise.all([
      loadImage('/images/axiso-logo.png'),
      loadImage('/images/axiso-signature.png')
    ]);

    // Create a new PDF document with A4 size
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    // Set page dimensions
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Set white background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Header with green border
    doc.setDrawColor(56, 161, 105);
    doc.setLineWidth(4);
    doc.line(0, 0, pageWidth, 0);
    doc.line(0, 4, pageWidth, 4);
    
    // Company name - professional font
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(56, 161, 105);
    doc.text('AXISO GREEN ENERGIES PRIVATE LIMITED', margin, 20);
    
    // Tagline
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(56, 161, 105);
    doc.text('Sustainable Energy Solutions for a Greener Tomorrow', margin, 27);
    
    // Company details - properly aligned
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    
    const companyDetails = [
      'Address: PLOT NO-102,103 TEMPLE LANE MYTHRI NAGAR',
      'Shri Ambika Vidya Mandir, MATHRUSRINAGAR, SERILINGAMPALLY',
      'Hyderabad, Rangareddy, Telangana, 500049',
      'Email: contact@axisogreen.in',
      'Website: www.axisogreen.in',
      'GSTIN: 36ABBCA4478M1Z9'
    ];
    
    companyDetails.forEach((detail, index) => {
      doc.text(detail, margin, 35 + (index * 5));
    });
    
    // Logo positioned properly - enlarged and better aligned
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', pageWidth - margin - 50, 12, 45, 35);
    }
    
    // Separator line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, 65, pageWidth - margin, 65);
    
    // Payment Receipt title - centered and professional
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(56, 161, 105);
    const titleText = 'PAYMENT RECEIPT';
    const titleWidth = doc.getTextWidth(titleText);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(titleText, titleX, 75);
    
    // Title underline
    doc.setDrawColor(56, 161, 105);
    doc.setLineWidth(1);
    doc.line(titleX, 78, titleX + titleWidth, 78);
    
    // Payment details section with proper grid layout
    const detailsStartY = 90;
    const leftColX = margin;
    const rightColX = pageWidth / 2 + 10;
    const labelWidth = 45;
    const valueX = leftColX + labelWidth;
    const lineHeight = 12;
    
    // Format date properly
    let formattedDate = date;
    if (typeof date === 'string') {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
    }
    
    // Reference number
    const refNumber = 'AGE' + Date.now().toString().slice(-6);
    
    // Payment details with consistent formatting
    const paymentDetails = [
      { label: 'Payment Date:', value: formattedDate },
      { label: 'Reference No:', value: refNumber },
      { label: 'Payment Mode:', value: paymentMode },
      { label: 'Place of Supply:', value: getPlaceOfSupplyWithCode(placeOfSupply) }
    ];
    
    // Draw payment details in a clean table format
    paymentDetails.forEach((detail, index) => {
      const y = detailsStartY + (index * lineHeight);
      
      // Label
      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(56, 161, 105);
      doc.text(detail.label, leftColX, y);
      
      // Value
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text(detail.value, valueX, y);
    });
    
    // Amount section with professional styling
    const amountBoxY = detailsStartY;
    const amountBoxX = rightColX;
    const amountBoxWidth = pageWidth - rightColX - margin;
    const amountBoxHeight = 35;
    
    // Amount box with border
    doc.setFillColor(56, 161, 105);
    doc.rect(amountBoxX, amountBoxY - 5, amountBoxWidth, amountBoxHeight, 'F');
    
    doc.setDrawColor(56, 161, 105);
    doc.setLineWidth(1);
    doc.rect(amountBoxX, amountBoxY - 5, amountBoxWidth, amountBoxHeight);
    
    // Amount text
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('AMOUNT RECEIVED', amountBoxX + 5, amountBoxY + 3);
    
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    const amountText = `Rs. ${amount.toLocaleString('en-IN')}`;
    doc.text(amountText, amountBoxX + 5, amountBoxY + 15);
    
    // Amount in words section
    const wordsY = detailsStartY + 60;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text('Amount in Words:', leftColX, wordsY);
    
    // Amount in words with proper formatting
    const amountInWords = `Indian Rupee ${convertToWords(amount)} Only`;
    
    // Background for amount in words
    doc.setFillColor(248, 250, 252);
    doc.rect(leftColX, wordsY + 5, pageWidth - 2 * margin, 20, 'F');
    
    // Border for amount in words
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(leftColX, wordsY + 5, pageWidth - 2 * margin, 20);
    
    // Amount in words text with proper line wrapping
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(56, 161, 105);
    
    const maxLineWidth = pageWidth - 2 * margin - 10;
    const words = amountInWords.split(' ');
    let line = '';
    let yPosition = wordsY + 15;
    
    words.forEach(word => {
      const testLine = line + (line ? ' ' : '') + word;
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth > maxLineWidth && line !== '') {
        doc.text(line, leftColX + 5, yPosition);
        line = word;
        yPosition += 8;
      } else {
        line = testLine;
      }
    });
    
    if (line) {
      doc.text(line, leftColX + 5, yPosition);
    }
    
    // Customer details section
    const customerY = wordsY + 40;
    
    // Section header
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(56, 161, 105);
    doc.text('RECEIVED FROM', leftColX, customerY);
    
    // Decorative line
    doc.setDrawColor(56, 161, 105);
    doc.setLineWidth(1);
    doc.line(leftColX, customerY + 2, leftColX + 40, customerY + 2);
    
    // Customer details box
    const customerBoxY = customerY + 8;
    const customerBoxHeight = 30;
    
    // Customer box background
    doc.setFillColor(248, 250, 252);
    doc.rect(leftColX, customerBoxY, pageWidth - 2 * margin, customerBoxHeight, 'F');
    
    // Customer box border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(leftColX, customerBoxY, pageWidth - 2 * margin, customerBoxHeight);
    
    // Customer name
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(receivedFrom, leftColX + 5, customerBoxY + 10);
    
    // Customer address with proper formatting
    if (customerAddress) {
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      
      const addressLines = formatAddressToLines(customerAddress, 70);
      addressLines.slice(0, 2).forEach((line, index) => {
        doc.text(line, leftColX + 5, customerBoxY + 20 + (index * 6));
      });
    }
    
    // Footer section
    const footerY = customerY + 55;
    
    // Thank you message
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(56, 161, 105);
    doc.text('Thank you for choosing sustainable energy solutions!', leftColX, footerY);
    
    // Signature section
    if (signatureImg) {
      const signatureX = pageWidth - margin - 55;
      doc.addImage(signatureImg, 'PNG', signatureX, footerY + 5, 45, 18);
      
      // Signature line
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.line(signatureX, footerY + 25, signatureX + 45, footerY + 25);
      
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text('Authorized Signature', signatureX, footerY + 30);
    }
    
    // Footer border
    doc.setDrawColor(56, 161, 105);
    doc.setLineWidth(2);
    doc.line(0, pageHeight - 5, pageWidth, pageHeight - 5);
    
    // Footer text
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Together, we power a sustainable future.', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Save PDF
    const cleanCustomerName = receivedFrom.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Axiso_Payment_Receipt_${cleanCustomerName}_${dateStr}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

// Helper functions
const getPlaceOfSupplyWithCode = (placeOfSupply: string): string => {
  switch (placeOfSupply.toLowerCase()) {
    case 'telangana':
      return 'Telangana (36)';
    case 'ap':
    case 'andhra pradesh':
      return 'Andhra Pradesh (37)';
    default:
      return placeOfSupply;
  }
};

const formatAddressToLines = (address: string, maxLength: number = 60): string[] => {
  if (!address) return [];
  
  const words = address.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + ' ' + word).length <= maxLength) {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  return lines;
};

const PaymentReceipt: React.FC<PaymentReceiptProps> = () => null;

// Helper function to load image
const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
      } catch (error) {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
};

export default PaymentReceipt;
