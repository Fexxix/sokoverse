import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { UserType } from "./UsersPage";

type UserReportPDFProps = {
  users: UserType[];
};

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 10 },
  header: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  subHeader: {
    fontSize: 12,
    marginBottom: 10,
    textAlign: "center",
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 14,
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "bold",
  },
  paragraph: {
    marginBottom: 6,
    lineHeight: 1.4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    borderBottomStyle: "solid",
    paddingVertical: 4,
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
  },
  userBlock: {
    marginBottom: 12,
    padding: 8,
    border: "1px solid #ccc",
    borderRadius: 4,
  },
  vaultEntry: {
    marginLeft: 8,
  },
});

const UsersReportPDF = ({ users }: UserReportPDFProps) => {
  const totalUsers = users.length;
  const totalVaults = users.reduce((acc, user) => acc + user.vaults, 0);
  const totalVaultsCreated = users.reduce(
    (acc, user) => acc + user.totalVaultsCreated,
    0
  );
  const totalEndless = users.reduce((acc, user) => acc + user.endless, 0);
  const totalBoxoban = users.reduce(
    (acc, user) =>
      acc + user.boxoban.medium + user.boxoban.hard + user.boxoban.unfiltered,
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.header}>User Gameplay Report</Text>
        <Text style={styles.subHeader}>
          Overview of user engagement across gameplay modes
        </Text>

        {/* Game Introduction */}
        <View style={styles.sectionTitle}>
          <Text> Game Introduction</Text>
        </View>
        <Text style={styles.paragraph}>
          This game is inspired by Sokoban-style puzzle mechanics. Players solve
          challenges in three primary gameplay modes:
        </Text>
        <Text style={styles.paragraph}>
          - **Endless Mode:** Randomly generated puzzles that continue
          endlessly.
          {"\n"}- **Boxoban Mode:** A curated set of puzzles sorted by
          difficulty: Medium, Hard, and Unfiltered.
          {"\n"}- **Vault Mode:** Community-created levels where users design
          and share puzzles.
        </Text>

        {/* Report Summary */}
        <Text style={styles.sectionTitle}>Report Summary</Text>
        <Text style={styles.paragraph}>
          This report summarizes user activity and level engagement. It includes
          both high-level summaries and detailed per-user statistics.
        </Text>
        <Text style={styles.paragraph}>
          - Total Users: {totalUsers}
          {"\n"}- Total Endless Levels Played: {totalEndless}
          {"\n"}- Total Boxoban Levels Solved: {totalBoxoban}
          {"\n"}- Vaults Played: {totalVaults}
          {"\n"}- Vaults Created: {totalVaultsCreated}
        </Text>

        {/* Summary Table */}
        <Text style={styles.sectionTitle}>Summary Table</Text>
        <View style={styles.tableRow}>
          {[
            "ID",
            "Name",
            "Anonymous",
            "Vaults",
            "Created",
            "Endless",
            "Boxoban (M/H/U)",
          ].map((header) => (
            <Text
              key={header}
              style={[styles.tableCell, styles.tableHeaderCell]}
            >
              {header}
            </Text>
          ))}
        </View>

        {users.map((user) => (
          <View key={user.id} style={styles.tableRow}>
            <Text style={styles.tableCell}>{user.id}</Text>
            <Text style={styles.tableCell}>{user.name}</Text>
            <Text style={styles.tableCell}>
              {user.isAnonymous ? "Yes" : "No"}
            </Text>
            <Text style={styles.tableCell}>{user.vaults}</Text>
            <Text style={styles.tableCell}>{user.totalVaultsCreated}</Text>
            <Text style={styles.tableCell}>{user.endless}</Text>
            <Text style={styles.tableCell}>
              {user.boxoban.medium}/{user.boxoban.hard}/
              {user.boxoban.unfiltered}
            </Text>
          </View>
        ))}

        {/* User Details */}
        <Text style={styles.sectionTitle}>User Details</Text>
        {users.map((user) => (
          <View key={user.id} style={styles.userBlock}>
            <Text style={{ fontWeight: "bold", fontSize: 12 }}>
              {user.name} (ID: {user.id})
            </Text>
            <Text>Google ID: {user.googleId}</Text>
            <Text>Anonymous: {user.isAnonymous ? "Yes" : "No"}</Text>
            <Text>Vaults Played: {user.vaults}</Text>
            <Text>Total Vaults Created: {user.totalVaultsCreated}</Text>
            <Text>Endless Mode: {user.endless}</Text>
            <Text>
              Boxoban → Medium: {user.boxoban.medium}, Hard: {user.boxoban.hard}
              , Unfiltered: {user.boxoban.unfiltered}
            </Text>
            <Text>Created At: {user.createdAt}</Text>

            {user.vaultsCreatedWithPlays.length > 0 && (
              <>
                <Text style={{ fontWeight: "bold", marginTop: 4 }}>
                  Vaults Created With Plays:
                </Text>
                {user.vaultsCreatedWithPlays.map((vault) => (
                  <Text key={vault.id} style={styles.vaultEntry}>
                    - {vault.name} (Played {vault.timesPlayed} times)
                  </Text>
                ))}
              </>
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
};

export default UsersReportPDF;
