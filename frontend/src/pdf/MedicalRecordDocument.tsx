import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Registrar fuentes (opcional, usar estandar por ahora)
/*
Font.register({
    family: 'Helvetica-Bold',
    src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf' 
});
*/

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
        alignItems: 'center'
    },
    logo: {
        width: 100,
        height: 50,
        objectFit: 'contain'
    },
    brandName: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#2563eb' // Blue-600
    },
    meta: {
        textAlign: 'right',
        fontSize: 8,
        color: '#666'
    },
    section: {
        margin: 10,
        padding: 10,
    },
    title: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 10,
        textTransform: 'uppercase',
        color: '#0f172a'
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5
    },
    label: {
        width: 100,
        fontFamily: 'Helvetica-Bold',
        fontSize: 10
    },
    value: {
        flex: 1,
        fontSize: 10
    },
    canvasContainer: {
        marginTop: 20,
        position: 'relative',
        height: 300,
        width: 200, // Ajustar según ratio
        alignSelf: 'center',
        border: '1px solid #eee'
    },
    bodyMapImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain'
    },
    marker: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'red',
        alignItems: 'center',
        justifyContent: 'center'
    },
    markerText: {
        color: 'white',
        fontSize: 6,
        fontFamily: 'Helvetica-Bold'
    },
    notesSection: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10
    }
});

interface MedicalRecordDocumentProps {
    data: any; // El record completo
    patient: any;
    tenant: any; // Config del tenant
    bodyMapImage?: string; // URL de la imagen base del body map
}

export const MedicalRecordDocument = ({ data, patient, tenant, bodyMapImage }: MedicalRecordDocumentProps) => {
    const isVet = tenant?.industry === 'VET';
    const patientLabel = isVet ? 'Paciente (Mascota)' : 'Paciente';
    const subLabel = isVet
        ? `${patient?.data?.species || 'Animal'} - ${patient?.data?.breed || 'Raza desconocida'}`
        : `${new Date().getFullYear() - (new Date(patient?.birthDate).getFullYear())} años`;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* HEADER DINÁMICO */}
                <View style={styles.header}>
                    <View>
                        {tenant?.theme?.logoUrl && !tenant.theme.logoUrl.endsWith('.svg') && !tenant.theme.logoUrl.startsWith('data:image/svg+xml') ? (
                            <Image src={tenant.theme.logoUrl} style={styles.logo} />
                        ) : (
                            <Text style={styles.brandName}>{tenant?.name || 'ALEG MEDIC'}</Text>
                        )}
                        <Text style={{ fontSize: 8, marginTop: 4, color: '#888' }}>
                            {tenant?.industry === 'VET' ? 'Clínica Veterinaria' : 'Centro Médico'}
                        </Text>
                    </View>
                    <View style={styles.meta}>
                        <Text>Fecha: {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
                        <Text>Folio: #{data.id ? data.id.slice(0, 8) : 'PENDIENTE'}</Text>
                    </View>
                </View>

                {/* INFO PACIENTE */}
                <View style={styles.section}>
                    <Text style={styles.title}>Detalle de Atención</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>{patientLabel}:</Text>
                        <Text style={styles.value}>{patient.name.toUpperCase()} ({subLabel})</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Identificación:</Text>
                        <Text style={styles.value}>{patient.dni || 'S/N'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Motivo:</Text>
                        <Text style={styles.value}>{data.title || 'Consulta General'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha Consulta:</Text>
                        <Text style={styles.value}>{format(new Date(data.date), 'dd MMMM yyyy', { locale: es })}</Text>
                    </View>
                </View>

                {/* NOTAS MEDICAS */}
                <View style={[styles.section, styles.notesSection]}>
                    <Text style={styles.title}>Evolución / Notas</Text>
                    <Text style={{ lineHeight: 1.5, textAlign: 'justify' }}>
                        {data.notes || 'Sin observaciones registradas.'}
                    </Text>
                </View>

                {/* BODY MAP VISUALIZACIÓN */}
                {data.data?.bodyMap && data.data.bodyMap.length > 0 && bodyMapImage && (
                    <View style={styles.section}>
                        <Text style={styles.title}>Mapa Corporal (Hallazgos)</Text>
                        <View style={styles.canvasContainer}>
                            <Image src={bodyMapImage} style={styles.bodyMapImage} />
                            {data.data.bodyMap.map((marker: any, index: number) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.marker,
                                        {
                                            left: `${marker.x}%`,
                                            top: `${marker.y}%`,
                                            transform: 'translate(-50%, -50%)' // Ajuste de centro
                                        }
                                    ]}
                                >
                                    <Text style={styles.markerText}>{index + 1}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={{ marginTop: 10 }}>
                            {data.data.bodyMap.map((marker: any, index: number) => (
                                <Text key={index} style={{ fontSize: 8, marginBottom: 2 }}>
                                    • Hallazgo {index + 1}: {marker.note || 'Sin notas'}
                                </Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* FOOTER */}
                <View style={{ position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }}>
                    <Text style={{ fontSize: 8, color: '#aaa' }}>
                        Generado por {tenant?.name || 'Platform'} - Documento Oficial
                    </Text>
                </View>
            </Page>
        </Document>
    );
};
